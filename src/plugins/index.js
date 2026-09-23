/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import router from '../router'
import i18n from './i18n'
import vuetify from './vuetify'

export function registerPlugins (app) {
  app.use(vuetify)
  app.use(router)
  app.use(i18n)
}
