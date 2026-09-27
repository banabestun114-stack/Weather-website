/**
 * composables/useWeather.js
 *
 * Talks to the Open-Meteo API (https://open-meteo.com) — free, no API key required.
 */

import { getWeatherIcon } from '@/composables/weatherIcons'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

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
  return {
    location: locationName,
    date: new Date(data.current.time).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    temp: Math.round(data.current.temperature_2m),
    image: getWeatherIcon(data.current.weather_code),
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
    return {
      label: new Date(isoDate).toLocaleDateString('en-US', { weekday: 'short' }),
      image: getWeatherIcon(data.daily.weather_code[index]),
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

    return {
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      image: getWeatherIcon(data.hourly.weather_code[index]),
      temp: Math.round(data.hourly.temperature_2m[index]),
    }
  })
}
