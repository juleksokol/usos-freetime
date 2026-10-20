import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CHOICES,
  DEFAULT_CHOICE,
  DICTIONARIES,
  LOCALES,
  browserLanguages,
  createTranslator,
  readStoredLanguage,
  resolveChoice,
  writeStoredLanguage,
} from '../lib/i18n'
import { I18nContext } from './I18nContext'
import { useSettings } from './SettingsContext'

export default function I18nProvider({ children }) {
  const { settings, updateSettings } = useSettings()
  const [stored, setStored] = useState(readStoredLanguage)

  // Wybór języka: ostatni wybór z tego urządzenia, potem ustawienie zapisane na koncie,
  // potem domyślny (polski)
  const accountChoice = CHOICES.includes(settings.language) ? settings.language : null
  const choice = stored ?? accountChoice ?? DEFAULT_CHOICE
  const lang = resolveChoice(choice, browserLanguages())

  // Wybór z konta zapamiętujemy też na urządzeniu (używa go m.in. ekran błędu)
  useEffect(() => {
    if (stored === null && accountChoice) writeStoredLanguage(accountChoice)
  }, [stored, accountChoice])

  // Język strony (czytniki ekranu dobierają na tej podstawie wymowę)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback(
    (next) => {
      if (!CHOICES.includes(next)) return

      writeStoredLanguage(next)
      setStored(next)
      updateSettings({ language: next }) // synchronizacja z kontem
    },
    [updateSettings]
  )

  const t = useMemo(() => createTranslator(lang, DICTIONARIES), [lang])

  const value = useMemo(
    () => ({ t, lang, choice, locale: LOCALES[lang], setLang }),
    [t, lang, choice, setLang]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}