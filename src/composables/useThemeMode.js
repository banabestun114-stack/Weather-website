/**
 * composables/useThemeMode.js
 *
 * Dark / light theme. The choice is remembered in localStorage; first-time
 * visitors get their device's setting.
 */

import vuetify from '@/plugins/vuetify'

const STORAGE_KEY = 'weather-theme'
const THEMES = { dark: 'weatherDark', light: 'weatherLight' }

function applyTheme (mode) {
  vuetify.theme.change(THEMES[mode])
  // Native scrollbars and form controls follow the theme too
  document.documentElement.style.colorScheme = mode
}

function detectMode () {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved in THEMES) return saved
  } catch {
    // Storage blocked — fall back to the device setting
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function initThemeMode () {
  applyTheme(detectMode())
}

export function useThemeMode () {
  const isDark = computed(() => vuetify.theme.global.name.value === THEMES.dark)

  function toggleTheme () {
    const mode = isDark.value ? 'light' : 'dark'
    applyTheme(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Storage blocked — the choice just won't be remembered
    }
  }

  return { isDark, toggleTheme }
}
