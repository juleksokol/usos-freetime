export const LANGUAGES = ['pl', 'en']
export const CHOICES = ['auto', 'pl', 'en'] // „auto” = język przeglądarki
export const DEFAULT_CHOICE = 'pl'
export const LOCALES = { pl: 'pl-PL', en: 'en-GB' }

const STORAGE_KEY = 'freetime:lang'

// Pierwszy obsługiwany język z listy preferencji przeglądarki; bez żadnego: angielski
export function detectLanguage(languages = []) {
  if (languages.length === 0) return 'pl'

  for (const code of languages) {
    const base = String(code).toLowerCase().split('-')[0]
    if (LANGUAGES.includes(base)) return base
  }

  return 'en'
}

// Zamienia wybór użytkownika (auto, pl, en) na konkretny język
export function resolveChoice(choice, languages = []) {
  if (choice === 'auto') return detectLanguage(languages)
  return LANGUAGES.includes(choice) ? choice : 'pl'
}

export function browserLanguages() {
  if (typeof navigator === 'undefined') return []
  if (navigator.languages?.length) return [...navigator.languages]
  return [navigator.language].filter(Boolean)
}

// Ostatni wybór języka zapamiętany na tym urządzeniu: 'auto' | 'pl' | 'en' | null
export function readStoredLanguage() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return CHOICES.includes(value) ? value : null
  } catch {
    return null
  }
}

export function writeStoredLanguage(choice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // brak dostępu do pamięci przeglądarki
  }
}