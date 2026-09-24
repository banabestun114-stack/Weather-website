/**
 * composables/useWeather.js
 *
 * Talks to the Open-Meteo API (https://open-meteo.com) — free, no API key required.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

// WMO weather codes -> { icon, color }, per day/night.
// https://open-meteo.com/en/docs#weathervariables
const WEATHER_VISUALS = {
  0: {
    day: { icon: 'mdi-weather-sunny', color: 'amber-lighten-1' },
    night: { icon: 'mdi-weather-night', color: 'blue-grey-lighten-2' },
  },
  1: {
    day: { icon: 'mdi-weather-partly-cloudy', color: 'amber-lighten-1' },
    night: { icon: 'mdi-weather-night-partly-cloudy', color: 'blue-grey-lighten-2' },
  },
  2: {
    day: { icon: 'mdi-weather-partly-cloudy', color: 'grey-lighten-1' },
    night: { icon: 'mdi-weather-night-partly-cloudy', color: 'blue-grey-lighten-2' },
  },
  3: {
    day: { icon: 'mdi-weather-cloudy', color: 'grey-lighten-1' },
    night: { icon: 'mdi-weather-cloudy', color: 'grey-lighten-1' },
  },
  45: { day: { icon: 'mdi-weather-fog', color: 'grey-lighten-1' } },
  48: { day: { icon: 'mdi-weather-fog', color: 'grey-lighten-1' } },
  51: { day: { icon: 'mdi-weather-rainy', color: 'blue-lighten-2' } },
  53: { day: { icon: 'mdi-weather-rainy', color: 'blue-lighten-2' } },
  55: { day: { icon: 'mdi-weather-pouring', color: 'blue-lighten-2' } },
  56: { day: { icon: 'mdi-weather-snowy-rainy', color: 'blue-lighten-2' } },
  57: { day: { icon: 'mdi-weather-snowy-rainy', color: 'blue-lighten-2' } },
  61: { day: { icon: 'mdi-weather-rainy', color: 'blue-lighten-2' } },
  63: { day: { icon: 'mdi-weather-pouring', color: 'blue-lighten-2' } },
  65: { day: { icon: 'mdi-weather-pouring', color: 'blue' } },
  66: { day: { icon: 'mdi-weather-snowy-rainy', color: 'blue-lighten-2' } },
  67: { day: { icon: 'mdi-weather-snowy-rainy', color: 'blue' } },
  71: { day: { icon: 'mdi-weather-snowy', color: 'grey-lighten-1' } },
  73: { day: { icon: 'mdi-weather-snowy', color: 'grey-lighten-1' } },
  75: { day: { icon: 'mdi-weather-snowy-heavy', color: 'grey-lighten-1' } },
  77: { day: { icon: 'mdi-weather-snowy', color: 'grey-lighten-1' } },
  80: { day: { icon: 'mdi-weather-pouring', color: 'blue-lighten-2' } },
  81: { day: { icon: 'mdi-weather-pouring', color: 'blue-lighten-2' } },
  82: { day: { icon: 'mdi-weather-pouring', color: 'blue' } },
  85: { day: { icon: 'mdi-weather-snowy', color: 'grey-lighten-1' } },
  86: { day: { icon: 'mdi-weather-snowy-heavy', color: 'grey-lighten-1' } },
  95: { day: { icon: 'mdi-weather-lightning-rainy', color: 'amber-lighten-1' } },
  96: { day: { icon: 'mdi-weather-lightning-rainy', color: 'amber-lighten-1' } },
  99: { day: { icon: 'mdi-weather-lightning-rainy', color: 'amber-lighten-1' } },
}

function getWeatherVisual (code, isDay = true) {
  const entry = WEATHER_VISUALS[code] ?? WEATHER_VISUALS[3]
  return (isDay ? entry.day : entry.night) ?? entry.day
}

/** Look up a place name via Open-Meteo's geocoding API. */
export async function geocodeLocation (query) {
  const params = new URLSearchParams({
    name: query,
    count: '1',
    language: 'en',
    format: 'json',
  })

  const response = await fetch(`${GEOCODING_URL}?${params}`)
  if (!response.ok) throw new Error('Failed to search for that place.')

  const data = await response.json()
  const match = data.results?.[0]
  if (!match) throw new Error(`Couldn't find "${query}". Try another place.`)

  return {
    name: [match.name, match.admin1, match.country].filter(Boolean).slice(0, 2).join(', '),
    latitude: match.latitude,
    longitude: match.longitude,
  }
}

/** Fetch current/hourly/daily forecast data for a coordinate. */
export async function fetchForecast (latitude, longitude, units = {}) {
  const {
    temperature = 'fahrenheit',
    windSpeed = 'mph',
    precipitation = 'inch',
  } = units

  const params = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    temperature_unit: temperature,
    wind_speed_unit: windSpeed,
    precipitation_unit: precipitation,
    timezone: 'auto',
    forecast_days: '7',
  })

  const response = await fetch(`${FORECAST_URL}?${params}`)
  if (!response.ok) throw new Error('Failed to fetch the forecast.')

  return response.json()
}

export function buildCurrentWeather (data, locationName) {
  const visual = getWeatherVisual(data.current.weather_code, data.current.is_day === 1)

  return {
    location: locationName,
    date: new Date(data.current.time).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    temp: Math.round(data.current.temperature_2m),
    icon: visual.icon,
  }
}

export function buildStats (data, units = {}) {
  const windLabel = units.windSpeed === 'kmh' ? 'km/h' : 'mph'
  const precipLabel = units.precipitation === 'mm' ? 'mm' : 'in'
  const precipValue = units.precipitation === 'mm'
    ? Math.round(data.current.precipitation)
    : data.current.precipitation.toFixed(2)

  return [
    { key: 'feelsLike', value: `${Math.round(data.current.apparent_temperature)}°` },
    { key: 'humidity', value: `${Math.round(data.current.relative_humidity_2m)}%` },
    { key: 'wind', value: `${Math.round(data.current.wind_speed_10m)} ${windLabel}` },
    { key: 'precipitation', value: `${precipValue} ${precipLabel}` },
  ]
}

export function buildDailyForecast (data) {
  return data.daily.time.map((isoDate, index) => {
    const visual = getWeatherVisual(data.daily.weather_code[index], true)

    return {
      label: new Date(isoDate).toLocaleDateString('en-US', { weekday: 'short' }),
      icon: visual.icon,
      color: visual.color,
      high: Math.round(data.daily.temperature_2m_max[index]),
      low: Math.round(data.daily.temperature_2m_min[index]),
    }
  })
}

export function buildHourlyForecast (data) {
  const now = new Date()
  const times = data.hourly.time
  let startIndex = times.findIndex(isoTime => new Date(isoTime) >= now)
  if (startIndex === -1) startIndex = 0

  return times.slice(startIndex, startIndex + 24).map((isoTime, offset) => {
    const index = startIndex + offset
    const date = new Date(isoTime)
    const hour = date.getHours()
    const visual = getWeatherVisual(data.hourly.weather_code[index], hour >= 6 && hour < 19)

    return {
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      icon: visual.icon,
      color: visual.color,
      temp: Math.round(data.hourly.temperature_2m[index]),
    }
  })
}
