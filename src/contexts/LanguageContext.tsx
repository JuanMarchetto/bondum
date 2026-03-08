import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getLocales } from 'expo-localization'
import { secureStorage } from '../services/storage/secureStorage'
import { getTranslations, translate, type Language, type Translations } from '../i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  translations: Translations
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await secureStorage.getLanguage()
        if (stored === 'en' || stored === 'es') {
          setLanguageState(stored)
        } else {
          const locales = getLocales()
          const deviceLang = locales[0]?.languageCode
          if (deviceLang === 'es') {
            setLanguageState('es')
          }
        }
      } catch (error) {
        console.error('[LanguageProvider] Failed to load language preference:', error)
      } finally {
        setIsReady(true)
      }
    })()
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    secureStorage.setLanguage(lang).catch((error) => {
      console.error('[LanguageProvider] Failed to persist language:', error)
    })
  }, [])

  const translations = getTranslations(language)

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(translations, key, params),
    [translations],
  )

  if (!isReady) return null

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}
