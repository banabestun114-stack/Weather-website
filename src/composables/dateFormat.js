/**
 * composables/dateFormat.js
 *
 * Date/time formatting per app language. Uses the browser's Intl data when it
 * has the locale, and a small built-in table otherwise — Chrome, for one,
 * ships no Central Kurdish (ckb) data and would silently fall back to English.
 */

const FALLBACKS = {
  ckb: {
    weekdays: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'],
    months: ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'],
    am: 'پ.ن',
    pm: 'د.ن',
    listSeparator: '، ',
  },
}

/** `language` is an entry of LANGUAGES in composables/useLanguage.js. */
export function createDateFormatter (language) {
  const fallback = FALLBACKS[language.code]
  const hasIntlData = Intl.DateTimeFormat.supportedLocalesOf(language.intl).length > 0

  if (fallback && !hasIntlData) {
    return {
      fullDate: date => `${fallback.weekdays[date.getDay()]}، ${date.getDate()}ی ${fallback.months[date.getMonth()]} ${date.getFullYear()}`,
      weekdayShort: date => fallback.weekdays[date.getDay()],
      hour: hour => `${hour % 12 || 12} ${hour < 12 ? fallback.am : fallback.pm}`,
      list: items => items.join(fallback.listSeparator),
    }
  }

  return {
    fullDate: date => date.toLocaleDateString(language.intl, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    weekdayShort: date => date.toLocaleDateString(language.intl, { weekday: 'short' }),
    hour: hour => new Date(2000, 0, 1, hour).toLocaleTimeString(language.intl, { hour: 'numeric' }),
    list: (items) => {
      try {
        return new Intl.ListFormat(language.intl, { style: 'short', type: 'conjunction' }).format(items)
      } catch {
        return items.join(', ')
      }
    },
  }
}
