import en from './en'
import enSettings from './en.settings'
import enToday from './en.today'
import pl from './pl'
import plSettings from './pl.settings'
import plToday from './pl.today'
import { DEFAULT_CHOICE, browserLanguages, readStoredLanguage, resolveChoice } from './language'
import { createTranslator } from './translate'

// Słowniki składamy z modułów (podstawowy + po jednym na obszar aplikacji)
export const DICTIONARIES = {
  pl: { ...pl, ...plSettings, ...plToday },
  en: { ...en, ...enSettings, ...enToday },
}
export { createTranslator, interpolate } from './translate'
export * from './language'

// Dla kodu poza Reactem i dostawcami (np. ekran błędu): bieżący język i tłumacz
export function currentLanguage() {
  return resolveChoice(readStoredLanguage() ?? DEFAULT_CHOICE, browserLanguages())
}

export function currentTranslator() {
  return createTranslator(currentLanguage(), DICTIONARIES)
}
