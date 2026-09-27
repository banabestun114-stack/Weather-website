/**
 * composables/useLanguage.js
 *
 * App language (English, Central Kurdish / Sorani, Arabic). Switching updates
 * vue-i18n, Vuetify (which flips the layout to right-to-left) and the <html>
 * lang/dir attributes, and remembers the choice in localStorage.
 */

import i18n from '@/plugins/i18n'
import vuetify from '@/plugins/vuetify'

const STORAGE_KEY = 'weather-language'

// `intl` is the locale for dates/times (see composables/dateFormat.js); `-u-nu-latn` keeps digits as 0–9
// so they match the temperatures shown elsewhere.
// `api` is the language sent to the geocoding APIs (they have no Sorani).
export const LANGUAGES = [
  { code: 'en', intl: 'en-US', api: 'en', rtl: false },
  { code: 'ckb', intl: 'ckb-IQ-u-nu-latn', api: 'en', rtl: true },
  { code: 'ar', intl: 'ar-IQ-u-nu-latn', api: 'ar', rtl: true },
]

function findLanguage (code) {
  return LANGUAGES.find(language => language.code === code)
}

function setLanguage (code) {
  const language = findLanguage(code) ?? LANGUAGES[0]

  i18n.global.locale.value = language.code
  vuetify.locale.current.value = language.code
  document.documentElement.lang = language.code
  document.documentElement.dir = language.rtl ? 'rtl' : 'ltr'

  try {
    localStorage.setItem(STORAGE_KEY, language.code)
  } catch {
    // Storage blocked (private mode etc.) — the choice just won't be remembered
  }
}

/** Saved choice first, then the browser's language, then English. */
function detectLanguage () {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (findLanguage(saved)) return saved
  } catch {
    // Storage blocked — fall through to the browser language
  }

  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag?.toLowerCase().split('-')[0]
    if (base === 'ckb' || base === 'ku') return 'ckb'
    if (base === 'ar') return 'ar'
    if (base === 'en') return 'en'
  }
  return 'en'
}

export function initLanguage () {
  setLanguage(detectLanguage())
}

export function useLanguage () {
  const language = computed(() => findLanguage(i18n.global.locale.value) ?? LANGUAGES[0])

  return {
    languages: LANGUAGES,
    language,
    setLanguage,
  }
}
