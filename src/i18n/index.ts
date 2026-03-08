import { en } from './en'
import { es } from './es'

export type Language = 'en' | 'es'
export type Translations = typeof en

export function getTranslations(lang: Language): Translations {
  return lang === 'es' ? es : en
}

export function translate(
  translations: Translations,
  key: string,
  params?: Record<string, string | number>,
): string {
  const keys = key.split('.')
  let value: any = translations
  for (const k of keys) {
    value = value?.[k]
  }
  if (typeof value !== 'string') {
    // Fall back to English before returning raw key
    let fallback: any = en
    for (const k of keys) {
      fallback = fallback?.[k]
    }
    value = typeof fallback === 'string' ? fallback : key
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_: string, param: string) =>
      params[param] !== undefined ? String(params[param]) : `{${param}}`,
    )
  }

  return value
}

export { en, es }
