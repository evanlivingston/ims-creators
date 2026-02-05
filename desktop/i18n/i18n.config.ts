
import { defineI18nConfig } from "#imports"
import locale_en from "./locales/en"
import locale_ru from "./locales/ru"

export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: locale_en,
      ru: locale_ru
    },
  }
})