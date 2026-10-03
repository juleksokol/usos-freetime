const PREFIX = 'freetime:cache:'

export function saveCache(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // brak miejsca lub dostępu do pamięci przeglądarki: pomijamy
  }
}

export function loadCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Wywoływane przy wylogowaniu, żeby plan nie został na współdzielonym urządzeniu
export function clearAllCaches() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // pomijamy
  }
}