/**
 * plugins/i18n.js
 *
 * Framework documentation: https://vue-i18n.intlify.dev
 */

import { createI18n } from 'vue-i18n'

import ar from '@/locales/ar.json'
import ckb from '@/locales/ckb.json'
import en from '@/locales/en.json'

export default createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, ckb, ar },
})
