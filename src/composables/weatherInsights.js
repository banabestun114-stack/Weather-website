/**
 * composables/weatherInsights.js
 *
 * Turns raw forecast + air-quality data into plain answers: is the heat
 * dangerous, is dust coming, when is the best time to go out, will it rain.
 * Everything returned here is language-neutral (keys + numbers); the
 * components translate it.
 */

import { dateFromIso, todayIso } from '@/composables/useWeather'
import { getWeatherCondition } from '@/composables/weatherIcons'

const toCelsius = (value, unit) => (unit === 'fahrenheit' ? (value - 32) * 5 / 9 : value)
const hourOf = iso => Number(iso.slice(11, 13))
const minutesOf = iso => hourOf(iso) * 60 + Number(iso.slice(14, 16))

/** Index of the current hour in an hourly `time` array (falls back to the start). */
function currentHourIndex (data, times) {
  const index = times.indexOf(`${data.current.time.slice(0, 13)}:00`)
  return Math.max(index, 0)
}

/** 'today' | 'tomorrow' | 'dayAfter' for an hourly timestamp. */
function relativeDay (data, iso) {
  const days = Math.round((dateFromIso(iso) - dateFromIso(todayIso(data))) / 86_400_000)
  return ['today', 'tomorrow', 'dayAfter'][days] ?? 'today'
}

function periodOf (hour) {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/** Highest feels-like temperature today, in the user's unit. */
function todayFeelsLikeMax (data) {
  const today = todayIso(data)
  const values = data.hourly.time
    .map((iso, index) => (iso.startsWith(today) ? data.hourly.apparent_temperature[index] : null))
    .filter(value => value != null)
  return values.length ? Math.max(...values) : data.current.apparent_temperature
}

function uvLevel (uv) {
  if (uv < 3) return 'low'
  if (uv < 6) return 'moderate'
  if (uv < 8) return 'high'
  if (uv < 11) return 'veryHigh'
  return 'extreme'
}

/**
 * Heat level from today's peak feels-like temperature (°C thresholds based on
 * the NOAA heat index bands), bumped to caution when the UV index is very high.
 */
function heatInsight (data, units) {
  const feelsLikeMax = todayFeelsLikeMax(data)
  const celsius = toCelsius(feelsLikeMax, units.temperature)
  const uvMax = data.daily.uv_index_max?.[data.daily.time.indexOf(todayIso(data))] ?? data.current.uv_index ?? 0

  let level = 'safe'
  if (celsius >= 54) level = 'extreme'
  else if (celsius >= 41) level = 'danger'
  else if (celsius >= 32) level = 'caution'
  if (level === 'safe' && uvMax >= 8) level = 'caution'

  return {
    level,
    feelsLikeMax: Math.round(feelsLikeMax),
    uvMax: Math.round(uvMax),
    uvLevel: uvLevel(uvMax),
  }
}

/**
 * The best 2-hour window to be outside in the next 24 hours, between 5 AM and
 * 10 PM: the coolest one normally, the warmest one on cold days.
 */
function bestTimeInsight (data, units, fmt) {
  const { time, apparent_temperature: feelsLike } = data.hourly
  const mode = toCelsius(todayFeelsLikeMax(data), units.temperature) < 18 ? 'warmest' : 'coolest'
  const start = currentHourIndex(data, time)

  let best = null
  for (let index = start; index < start + 24 && index + 1 < time.length; index++) {
    const hour = hourOf(time[index])
    if (hour < 5 || hour > 20) continue

    const score = (feelsLike[index] + feelsLike[index + 1]) / 2
    const isBetter = mode === 'coolest' ? score < best?.score : score > best?.score
    if (!best || isBetter) best = { index, hour, score }
  }
  if (!best) return null

  return {
    mode,
    start: fmt.hour(best.hour),
    end: fmt.hour(best.hour + 2),
    day: relativeDay(data, time[best.index]),
    feelsLike: Math.round(best.score),
  }
}

// Dust concentration bands in µg/m³ (CAMS dust forecasts; dust storms reach the thousands)
function dustLevel (dust) {
  if (dust < 50) return 'low'
  if (dust < 150) return 'moderate'
  if (dust < 500) return 'high'
  return 'severe'
}

// US AQI bands
function aqiLevel (aqi) {
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return 'moderate'
  if (aqi <= 150) return 'sensitive'
  if (aqi <= 200) return 'unhealthy'
  if (aqi <= 300) return 'veryUnhealthy'
  return 'hazardous'
}

/** Peak dust in the next 48 hours, and when it arrives if it's bad enough to warn about. */
function dustInsight (data, air) {
  const dust = air?.hourly?.dust
  if (!dust) return null

  const start = currentHourIndex(data, air.hourly.time)
  let peak = { value: -1, index: start }
  for (let index = start; index < start + 48 && index < dust.length; index++) {
    if (dust[index] != null && dust[index] > peak.value) peak = { value: dust[index], index }
  }
  if (peak.value < 0) return null

  const level = dustLevel(peak.value)
  const peakTime = air.hourly.time[peak.index]
  const aqi = air.current?.us_aqi

  return {
    level,
    peak: Math.round(peak.value),
    // Only warn about when it arrives for high/severe dust
    expected: level === 'high' || level === 'severe'
      ? { day: relativeDay(data, peakTime), period: periodOf(hourOf(peakTime)) }
      : null,
    aqi: aqi == null ? null : Math.round(aqi),
    aqiLevel: aqi == null ? null : aqiLevel(aqi),
  }
}

/** Days in the next week where rain is likely (≥ 50% chance or ≥ 1 mm). */
function weekInsight (data, units, fmt) {
  const today = todayIso(data)
  const threshold = units.precipitation === 'inch' ? 0.04 : 1
  const { time, precipitation_sum: sums, precipitation_probability_max: chances } = data.daily

  const rainDays = time
    .map((isoDate, index) => ({ isoDate, index }))
    .filter(({ isoDate, index }) => isoDate >= today && ((chances?.[index] ?? 0) >= 50 || (sums?.[index] ?? 0) >= threshold))
    .map(({ isoDate }) => fmt.weekdayShort(dateFromIso(isoDate)))

  return { rainDays, list: fmt.list(rainDays) }
}

/** `fmt` is a formatter from createDateFormatter() in composables/dateFormat.js. */
export function buildInsights (data, air, units, fmt) {
  return {
    heat: heatInsight(data, units),
    dust: dustInsight(data, air),
    bestTime: bestTimeInsight(data, units, fmt),
    week: weekInsight(data, units, fmt),
  }
}

/**
 * Background scene for the hero card:
 * storm | rain | snow | dust | fog | night | golden | cloudy | hot | clear
 */
export function getScene (data, air, units) {
  const condition = getWeatherCondition(data.current.weather_code)
  if (condition === 'storm' || condition === 'rain' || condition === 'snow') return condition
  if ((air?.current?.dust ?? 0) >= 150) return 'dust'
  if (condition === 'fog') return 'fog'
  if (data.current.is_day !== 1) return 'night'

  // Within 45 minutes of sunrise or sunset
  const todayIndex = data.daily.time.indexOf(todayIso(data))
  const now = minutesOf(data.current.time)
  const sunrise = data.daily.sunrise?.[todayIndex]
  const sunset = data.daily.sunset?.[todayIndex]
  if ((sunrise && Math.abs(now - minutesOf(sunrise)) <= 45) || (sunset && Math.abs(now - minutesOf(sunset)) <= 45)) {
    return 'golden'
  }

  if (condition === 'cloudy') return 'cloudy'
  if (toCelsius(data.current.temperature_2m, units.temperature) >= 35) return 'hot'
  return 'clear'
}
