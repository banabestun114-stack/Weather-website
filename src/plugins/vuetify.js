/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
import { ar, en } from 'vuetify/locale'
// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  locale: {
    locale: 'en',
    fallback: 'en',
    // Vuetify ships no Central Kurdish strings, so its own labels (e.g. "Clear") use English there
    messages: { en, ar, ckb: en },
    rtl: { ar: true, ckb: true },
  },
  theme: {
    defaultTheme: 'weatherDark',
    themes: {
      weatherDark: {
        dark: true,
        colors: {
          background: '#0b0d17',
          surface: '#12141f',
          'surface-bright': '#1a1d2b',
          primary: '#4f63f5',
        },
      },
    },
  },
})
