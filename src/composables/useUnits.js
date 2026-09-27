/**
 * composables/useUnits.js
 *
 * Shared unit preferences (temperature, wind speed, precipitation).
 * A module-level reactive object, so every component that calls
 * useUnits() reads/writes the same shared state.
 */

const state = reactive({
  temperature: 'celsius', // 'celsius' | 'fahrenheit'
  windSpeed: 'kmh', // 'kmh' | 'mph'
  precipitation: 'mm', // 'mm' | 'inch'
})

const isImperial = computed(() =>
  state.temperature === 'fahrenheit'
  && state.windSpeed === 'mph'
  && state.precipitation === 'inch',
)

function toggleSystem () {
  if (isImperial.value) {
    state.temperature = 'celsius'
    state.windSpeed = 'kmh'
    state.precipitation = 'mm'
  } else {
    state.temperature = 'fahrenheit'
    state.windSpeed = 'mph'
    state.precipitation = 'inch'
  }
}

export function useUnits () {
  return {
    units: state,
    isImperial,
    toggleSystem,
    setTemperature: unit => { state.temperature = unit },
    setWindSpeed: unit => { state.windSpeed = unit },
    setPrecipitation: unit => { state.precipitation = unit },
  }
}
