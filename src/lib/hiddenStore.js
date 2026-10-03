const HIDDEN_KEY_PREFIX = 'freetime:hidden:'

// Ukryte osoby zapamiętujemy osobno dla każdej grupy (na tym urządzeniu)
export function loadHidden(groupId) {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY_PREFIX + groupId)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHidden(groupId, ids) {
  try {
    localStorage.setItem(HIDDEN_KEY_PREFIX + groupId, JSON.stringify(ids))
  } catch {
    // brak dostępu do pamięci przeglądarki: wybór zadziała tylko do odświeżenia
  }
}