const REMEMBER_KEY = 'freetime:remember'

// Czy zapamiętywać logowanie (domyślnie tak)
export function getRememberPreference() {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== '0'
  } catch {
    return true
  }
}

export function setRememberPreference(remember) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  } catch {
    // brak dostępu do pamięci przeglądarki
  }
}

// Zapamiętane logowanie trzymamy w localStorage, a niezapamiętane w sessionStorage
// (znika po zamknięciu przeglądarki).
export function activeStorage() {
  try {
    return getRememberPreference() ? window.localStorage : window.sessionStorage
  } catch {
    return window.localStorage
  }
}

// Po zmianie wyboru "Zapamiętaj mnie" usuwa tokeny z drugiego magazynu
export function clearOtherStorageTokens() {
  try {
    const other = getRememberPreference() ? window.sessionStorage : window.localStorage
    Object.keys(other)
      .filter((key) => key.startsWith('sb-'))
      .forEach((key) => other.removeItem(key))
  } catch {
    // pomijamy
  }
}