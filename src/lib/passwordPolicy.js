// Wymagania hasła. Są zgodne z ustawieniami Supabase Auth (małe i wielkie litery, cyfry
// i symbole), a kilka dodatkowych sprawdzeń robi tylko aplikacja.

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_BYTES = 72 // bcrypt (Supabase) nie obsługuje dłuższych haseł

// Symbole akceptowane przez Supabase Auth
const SYMBOLS = '!@#$%^&*()_+-=[]{};\'\\:"|<>?,./`~'

// Popularne hasła (porównujemy całe hasło oraz ciąg samych liter, małymi literami)
const COMMON = new Set([
  'password',
  'passw0rd',
  'haslo',
  'hasło',
  'tajne',
  'tajnehaslo',
  'qwerty',
  'qwertyuiop',
  'azerty',
  'admin',
  'administrator',
  'letmein',
  'welcome',
  'iloveyou',
  'monkey',
  'dragon',
  'master',
  'superman',
  'football',
  'login',
  'abc',
  'abcdef',
  'student',
  'studia',
  'uczelnia',
  'agh',
  'usos',
  'test',
])

// Kolejność jest stała: tak wyświetlamy listę wymagań
export const PASSWORD_RULE_IDS = [
  'length',
  'lower',
  'upper',
  'digit',
  'symbol',
  'email',
  'common',
  'max',
]

/**
 * Sprawdza hasło i zwraca listę { id, ok } dla wszystkich wymagań:
 *  length (min. długość), lower, upper, digit, symbol (jak w Supabase),
 *  email (hasło nie zawiera części adresu e-mail przed @),
 *  common (to nie jest popularne hasło), max (maks. 72 bajty).
 */
export function evaluatePassword(password, { email = '' } = {}) {
  const value = String(password ?? '')
  const lower = value.toLowerCase()
  const letters = lower.replace(/[^a-ząćęłńóśźż]/g, '')
  const local = String(email ?? '').split('@')[0].toLowerCase()
  const bytes = new TextEncoder().encode(value).length

  const checks = {
    length: [...value].length >= PASSWORD_MIN_LENGTH,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    digit: /[0-9]/.test(value),
    symbol: [...value].some((char) => SYMBOLS.includes(char)),
    email: local.length < 4 || !lower.includes(local),
    common: !(COMMON.has(lower) || (letters.length >= 3 && COMMON.has(letters))),
    max: bytes <= PASSWORD_MAX_BYTES,
  }

  return PASSWORD_RULE_IDS.map((id) => ({ id, ok: checks[id] }))
}

export function failedRuleIds(password, options) {
  return evaluatePassword(password, options)
    .filter((rule) => !rule.ok)
    .map((rule) => rule.id)
}

export function isPasswordValid(password, options) {
  return failedRuleIds(password, options).length === 0
}

/**
 * Czy konto musi zmienić hasło: użytkownik zalogował się hasłem niespełniającym wymagań
 * (weakLogin) albo ma to zapisane na koncie (po odświeżeniu strony).
 */
export function needsPasswordChange({ user, weakLogin = false }) {
  return Boolean(user) && (weakLogin || user.user_metadata?.password_change_required === true)
}