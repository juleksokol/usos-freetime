import en from './en'
import pl from './pl'
import { DEFAULT_CHOICE, browserLanguages, readStoredLanguage, resolveChoice } from './language'
import { createTranslator } from './translate'

export const DICTIONARIES = { pl, en }
export { createTranslator, interpolate } from './translate'
export * from './language'

// Dla kodu poza Reactem i dostawcami (np. ekran błędu): bieżący język i tłumacz
export function currentLanguage() {
  return resolveChoice(readStoredLanguage() ?? DEFAULT_CHOICE, browserLanguages())
}

export function currentTranslator() {
  return createTranslator(currentLanguage(), DICTIONARIES)
}