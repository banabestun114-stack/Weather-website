/**
 * composables/weatherIcons.js
 *
 * Maps Open-Meteo's WMO weather codes to the icon artwork in src/assets/weather.
 * https://open-meteo.com/en/docs#weathervariables
 */

import iconClearNight from '@/assets/weather/icon-clear-night.svg'
import iconDrizzle from '@/assets/weather/icon-drizzle.webp'
import iconFog from '@/assets/weather/icon-fog.webp'
import iconOvercast from '@/assets/weather/icon-overcast.webp'
import iconPartlyCloudyNight from '@/assets/weather/icon-partly-cloudy-night.svg'
import iconPartlyCloudy from '@/assets/weather/icon-partly-cloudy.webp'
import iconRain from '@/assets/weather/icon-rain.webp'
import iconSnow from '@/assets/weather/icon-snow.webp'
import iconStorm from '@/assets/weather/icon-storm.webp'
import iconSunny from '@/assets/weather/icon-sunny.webp'

const WEATHER_CODE_ICONS = {
  0: iconSunny,
  1: iconSunny,
  2: iconPartlyCloudy,
  3: iconOvercast,
  45: iconFog,
  48: iconFog,
  51: iconDrizzle,
  53: iconDrizzle,
  55: iconDrizzle,
  56: iconDrizzle,
  57: iconDrizzle,
  61: iconRain,
  63: iconRain,
  65: iconRain,
  66: iconRain,
  67: iconRain,
  71: iconSnow,
  73: iconSnow,
  75: iconSnow,
  77: iconSnow,
  80: iconRain,
  81: iconRain,
  82: iconRain,
  85: iconSnow,
  86: iconSnow,
  95: iconStorm,
  96: iconStorm,
  99: iconStorm,
}

// Only the icons that show a sun need a night version
const NIGHT_ICONS = new Map([
  [iconSunny, iconClearNight],
  [iconPartlyCloudy, iconPartlyCloudyNight],
])

/** `isDay` follows Open-Meteo's `is_day` flag (1 = day, 0 = night). */
export function getWeatherIcon (code, isDay = true) {
  const icon = WEATHER_CODE_ICONS[code] ?? iconOvercast
  return isDay ? icon : (NIGHT_ICONS.get(icon) ?? icon)
}

/** Broad condition for a WMO code — used to pick the hero card's background scene. */
export function getWeatherCondition (code) {
  if (code <= 1) return 'clear'
  if (code === 2) return 'partly'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  if (code >= 51) return 'rain'
  return 'cloudy'
}
