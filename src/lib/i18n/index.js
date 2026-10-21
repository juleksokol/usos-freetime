import en from './en'
import enSettings from './en.settings'
import pl from './pl'
import plSettings from './pl.settings'
import { DEFAULT_CHOICE, browserLanguages, readStoredLanguage, resolveChoice } from './language'
import { createTranslator } from './translate'

// Słowniki składamy z modułów (podstawowy + po jednym na obszar aplikacji)
export const DICTIONARIES = {
  pl: { ...pl, ...plSettings },
  en: { ...en, ...enSettings },
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
