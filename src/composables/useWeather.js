/**
 * composables/useWeather.js
 *
 * Talks to the Open-Meteo API (https://open-meteo.com) — free, no API key required.
 */

import { getWeatherIcon } from '@/composables/weatherIcons'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
// Open-Meteo has no reverse geocoding, so use BigDataCloud's free client-side endpoint (no API key).
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

/**
 * Errors carry an i18n key (see `errors` in src/locales/en.json) instead of
 * English text, so the component can translate them with `t(error.i18nKey, error.params)`.
 */
function weatherError (i18nKey, params = {}) {
  const error = new Error(i18nKey)
  error.i18nKey = i18nKey
  error.params = params
  return error
}

/** Find places matching a name via Open-Meteo's geocoding API (used for search suggestions). */
export async function searchPlaces (query, count = 5, { signal, language = 'en' } = {}) {
  const params = new URLSearchParams({
    name: query,
    count: String(count),
    language,
    format: 'json',
  })

  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal })
  if (!response.ok) throw weatherError('errors.searchFailed')

  const data = await response.json()
  return (data.results ?? []).map(match => ({
    id: match.id,
    name: [match.name, match.admin1, match.country].filter(Boolean).slice(0, 2).join(', '),
    // Shown under the city in the suggestion list, e.g. "Kurdistan, Iraq"
    city: match.name,
    region: [match.admin1, match.country].filter(Boolean).join(', '),
    latitude: match.latitude,
    longitude: match.longitude,
  }))
}

/** Look up the best match for a place name. */
export async function geocodeLocation (query, language = 'en') {
  const [match] = await searchPlaces(query, 1, { language })
  if (!match) throw weatherError('errors.placeNotFound', { query })

  return match
}

/**
 * Ask the browser for the user's position. Rejects if geolocation is
 * unsupported, denied, or the user doesn't answer the prompt in time.
 */
export function getBrowserPosition (timeout = 10_000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(weatherError('errors.geolocationUnsupported'))
      return
    }

    // The geolocation `timeout` option doesn't cover the permission prompt, so add our own
    const timer = setTimeout(() => reject(weatherError('errors.geolocationTimeout')), timeout)

    navigator.geolocation.getCurrentPosition(
      position => {
        clearTimeout(timer)
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      error => {
        clearTimeout(timer)
        reject(error)
      },
      { maximumAge: 10 * 60 * 1000, timeout },
    )
  })
}

/** Turn coordinates into a "City, Country" label. */
export async function reverseGeocode (latitude, longitude, language = 'en') {
  const params = new URLSearchParams({
    latitude,
    longitude,
    localityLanguage: language,
  })

  const response = await fetch(`${REVERSE_GEOCODING_URL}?${params}`)
  if (!response.ok) throw weatherError('errors.reverseGeocodeFailed')

  const data = await response.json()
  const city = data.city || data.locality || data.principalSubdivision
  return [city, data.countryName].filter(Boolean).join(', ')
}

/**
 * Fetch current/hourly/daily forecast data for a coordinate.
 * `past_days: 1` includes yesterday, for the "warmer than yesterday" comparison —
 * the builders below skip it when showing the forecast.
 */
export async function fetchForecast (latitude, longitude, units = {}) {
  const {
    temperature = 'celsius',
    windSpeed = 'kmh',
    precipitation = 'mm',
  } = units

  const params = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day,uv_index',
    hourly: 'temperature_2m,apparent_temperature,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max',
    temperature_unit: temperature,
    wind_speed_unit: windSpeed,
    precipitation_unit: precipitation,
    timezone: 'auto',
    past_days: '1',
    forecast_days: '7',
  })

  const response = await fetch(`${FORECAST_URL}?${params}`)
  if (!response.ok) throw weatherError('errors.forecastFailed')

  return response.json()
}

/** Dust and air quality for the next 3 days (Open-Meteo Air Quality API, also free). */
export async function fetchAirQuality (latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: 'dust,pm10,us_aqi',
    hourly: 'dust',
    timezone: 'auto',
    forecast_days: '3',
  })

  const response = await fetch(`${AIR_QUALITY_URL}?${params}`)
  if (!response.ok) throw weatherError('errors.forecastFailed')

  return response.json()
}

/**
 * Open-Meteo times are local to the place ("2026-09-27T14:00"), so build Dates
 * from the parts instead of letting the browser shift them through UTC.
 */
export function dateFromIso (iso) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** The place's current date, e.g. "2026-09-27". */
export function todayIso (data) {
  return data.current.time.slice(0, 10)
}

/** `fmt` (in the builders below) is a formatter from createDateFormatter() in composables/dateFormat.js. */
export function buildCurrentWeather (data, locationName, fmt) {
  const todayIndex = data.daily.time.indexOf(todayIso(data))
  const yesterdayHigh = data.daily.temperature_2m_max[todayIndex - 1]
  const todayHigh = data.daily.temperature_2m_max[todayIndex]

  return {
    location: locationName,
    date: fmt.fullDate(dateFromIso(data.current.time)),
    temp: Math.round(data.current.temperature_2m),
    image: getWeatherIcon(data.current.weather_code, data.current.is_day === 1),
    // Today's high minus yesterday's high; null when yesterday isn't available
    vsYesterday: yesterdayHigh == null ? null : Math.round(todayHigh - yesterdayHigh),
  }
}

/** `unit` is a key under `units` in the locale files; feels-like/humidity carry their symbol in `value`. */
export function buildStats (data, units = {}) {
  const precipValue = units.precipitation === 'inch'
    ? data.current.precipitation.toFixed(2)
    : Math.round(data.current.precipitation)

  return [
    { key: 'feelsLike', value: `${Math.round(data.current.apparent_temperature)}°` },
    { key: 'humidity', value: `${Math.round(data.current.relative_humidity_2m)}%` },
    { key: 'wind', value: Math.round(data.current.wind_speed_10m), unit: units.windSpeed === 'mph' ? 'mph' : 'kmh' },
    { key: 'precipitation', value: precipValue, unit: units.precipitation === 'inch' ? 'inch' : 'mm' },
  ]
}

export function buildDailyForecast (data, fmt) {
  const today = todayIso(data)

  return data.daily.time.flatMap((isoDate, index) => {
    // Skip yesterday (from past_days)
    if (isoDate < today) return []

    return [{
      label: fmt.weekdayShort(dateFromIso(isoDate)),
      image: getWeatherIcon(data.daily.weather_code[index]),
      high: Math.round(data.daily.temperature_2m_max[index]),
      low: Math.round(data.daily.temperature_2m_min[index]),
    }]
  })
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * Group hourly data by day. Open-Meteo returns times in the location's own
 * timezone ("2026-09-27T14:00"), so we read the date/hour straight from the
 * string instead of converting through the browser's timezone.
 */
export function buildHourlyForecast (data, fmt) {
  const today = todayIso(data)
  const days = []

  data.hourly.time.forEach((isoTime, index) => {
    const isoDate = isoTime.slice(0, 10)
    // Skip yesterday (from past_days)
    if (isoDate < today) return

    let day = days.at(-1)
    if (day?.date !== isoDate) {
      day = {
        date: isoDate,
        dayKey: DAY_KEYS[dateFromIso(isoDate).getDay()],
        hours: [],
      }
      days.push(day)
    }

    day.hours.push({
      time: fmt.hour(Number(isoTime.slice(11, 13))),
      image: getWeatherIcon(data.hourly.weather_code[index], data.hourly.is_day[index] === 1),
      temp: Math.round(data.hourly.temperature_2m[index]),
    })
  })

  return days
}
