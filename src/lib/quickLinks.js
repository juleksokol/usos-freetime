import { normalizeText } from './text'

export const MAX_LINKS = 12

// Klucze symboli dostępnych w edytorze ikon (odpowiadają ikonom w linkSymbols.js)
export const SYMBOL_KEYS = [
  'mail',
  'book',
  'graduation',
  'building',
  'home',
  'calendar',
  'globe',
  'laptop',
  'library',
  'map',
  'users',
  'file',
  'chat',
  'cloud',
  'shield',
  'food',
  'clipboard',
  'video',
  'sport',
  'link',
  'wallet',
  'briefcase',
  'bus',
  'bed',
]

// Kolory ikon (dobrane tak, żeby biała litera lub symbol były czytelne)
export const ICON_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#64748b',
  '#84cc16',
  '#06b6d4',
]

export const EMOJI_PRESETS = ['🔗', '📚', '💻', '🎓', '✉️', '🏠', '📅', '🍽️', '🗺️', '🎥', '⭐', '🏋️']

// Propozycje do szybkiego dodania (adresy sprawdź przed użyciem, mogą się zmienić)
export const SUGGESTED_LINKS = [
  { name: 'UPeL', url: 'https://upel.agh.edu.pl' },
  { name: 'Syllabus', url: 'https://syllabus.agh.edu.pl' },
  { name: 'Poczta AGH', url: 'https://poczta.agh.edu.pl' },
  { name: 'USOSweb', url: 'https://web.usos.agh.edu.pl' },
]

// Słowa kluczowe nazwy lub adresu -> symbol i emoji (dopasowanie po początku słowa)
const KEYWORD_ICONS = [
  { words: ['poczta', 'mail', 'email', 'outlook', 'gmail'], symbol: 'mail', emoji: '✉️' },
  { words: ['syllabus', 'sylabus', 'sylabusy'], symbol: 'book', emoji: '📚' },
  { words: ['upel', 'moodle', 'elearning', 'kurs', 'platforma'], symbol: 'laptop', emoji: '💻' },
  { words: ['usos', 'dziekanat'], symbol: 'graduation', emoji: '🎓' },
  { words: ['akademik', 'olimp', 'dormitory'], symbol: 'bed', emoji: '🏠' },
  { words: ['biblioteka', 'library', 'bg'], symbol: 'library', emoji: '📖' },
  { words: ['plan', 'kalendarz', 'terminarz', 'calendar'], symbol: 'calendar', emoji: '📅' },
  { words: ['mapa', 'mapy', 'dojazd', 'map'], symbol: 'map', emoji: '🗺️' },
  { words: ['teams', 'zoom', 'meet', 'spotkanie'], symbol: 'video', emoji: '🎥' },
  { words: ['stolowka', 'obiad', 'jadlospis', 'bar', 'menu'], symbol: 'food', emoji: '🍽️' },
  { words: ['stypendium', 'stypendia', 'finanse', 'platnosc', 'czesne', 'bank'], symbol: 'wallet', emoji: '💰' },
  { words: ['chat', 'czat', 'messenger', 'discord', 'whatsapp'], symbol: 'chat', emoji: '💬' },
  { words: ['dysk', 'drive', 'cloud', 'onedrive'], symbol: 'cloud', emoji: '☁️' },
  { words: ['silownia', 'sport', 'azs', 'wf'], symbol: 'sport', emoji: '🏋️' },
  { words: ['kolo', 'kola', 'samorzad', 'organizacja'], symbol: 'users', emoji: '👥' },
  { words: ['praktyki', 'praca', 'kariera', 'rekrutacja'], symbol: 'briefcase', emoji: '💼' },
  { words: ['autobus', 'tramwaj', 'rozklad', 'mpk'], symbol: 'bus', emoji: '🚌' },
]

const FALLBACK_EMOJIS = ['🔗', '⭐', '📌', '🌐', '🧭', '🚀']

// Normalizuje adres wpisany przez użytkownika: dopisuje https://, przepuszcza tylko http(s)
export function normalizeUrl(input) {
  const text = String(input ?? '').trim()
  if (!text) return null

  const hasExplicitScheme =
    /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ||
    /^(javascript|data|mailto|tel|file|ftp|blob):/i.test(text)
  const candidate = hasExplicitScheme ? text : `https://${text}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null
    return url.href
  } catch {
    return null
  }
}

export function hostnameOf(input) {
  const href = normalizeUrl(input)
  if (!href) return null
  return new URL(href).hostname.replace(/^www\./, '')
}

// Sprawdza formularz linku; zwraca { error } albo { name, url }
export function validateLink({ name, url }) {
  const trimmed = String(name ?? '').trim()
  if (!trimmed) return { error: 'Podaj nazwę przycisku.' }
  if (trimmed.length > 24) return { error: 'Nazwa może mieć maksymalnie 24 znaki.' }

  const normalized = normalizeUrl(url)
  if (!normalized) {
    return { error: 'Podaj poprawny adres strony, np. upel.agh.edu.pl lub https://…' }
  }

  return { name: trimmed, url: normalized }
}

export function newLinkId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  )
}

function hash(text) {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

// Litery do ikony: "Poczta AGH" -> "PA", "UPeL" -> "UP", "AGH" -> "AGH"
export function initialsOf(text) {
  const words = String(text ?? '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

  if (words.length === 0) return ''

  if (words.length === 1) {
    const word = words[0]
    if (word.length <= 3 && word === word.toUpperCase()) return word
    return word.slice(0, 2).toUpperCase()
  }

  return words
    .slice(0, 3)
    .map((word) => word[0].toUpperCase())
    .join('')
}

/**
 * Lista propozycji ikon dla linku (od najtrafniejszej):
 * symbol dopasowany do nazwy lub adresu, litery, emoji i dwa inne symbole.
 * Wynik zależy tylko od nazwy i adresu, więc jest powtarzalny.
 */
export function iconCandidates(name, url) {
  const host = hostnameOf(url) ?? ''
  const base = normalizeText(`${name} ${host}`)
  const tokens = base.split(' ').filter(Boolean)
  const seed = hash(base || 'link')
  const color = (step) => ICON_COLORS[(seed + step * 5) % ICON_COLORS.length]

  const match = KEYWORD_ICONS.find((item) =>
    item.words.some((word) => tokens.some((token) => token.startsWith(word)))
  )
  const initials = initialsOf(name || host)

  const candidates = []

  if (match) {
    candidates.push({ kind: 'symbol', value: match.symbol, color: color(0), shape: 'rounded' })
  }
  if (initials) {
    candidates.push({ kind: 'initials', value: initials, color: color(1), shape: 'rounded' })
  }

  candidates.push({
    kind: 'emoji',
    value: match?.emoji ?? FALLBACK_EMOJIS[seed % FALLBACK_EMOJIS.length],
    color: color(2),
    shape: 'rounded',
  })

  for (let i = 0; i < 2; i++) {
    candidates.push({
      kind: 'symbol',
      value: SYMBOL_KEYS[(seed + i * 7) % SYMBOL_KEYS.length],
      color: color(3 + i),
      shape: i === 0 ? 'circle' : 'rounded',
    })
  }

  return candidates
}

/**
 * Ikona dla linku. seed = 0 daje najtrafniejszą propozycję, kolejne wartości ("Losuj inną")
 * przechodzą przez pozostałe propozycje, a po pełnym obiegu zmieniają kolory.
 */
export function generateIcon(name, url, seed = 0) {
  const candidates = iconCandidates(name, url)
  const spec = candidates[seed % candidates.length]
  const round = Math.floor(seed / candidates.length)

  if (round === 0) return spec

  const index = ICON_COLORS.indexOf(spec.color)
  return { ...spec, color: ICON_COLORS[(index + round * 3) % ICON_COLORS.length] }
}

function toRgb(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!match) return null

  const value = parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const toHex = (channels) =>
  `#${channels.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`

// Rozjaśnia kolor #rrggbb o podaną część (0-1)
export function lightenColor(hex, amount) {
  const rgb = toRgb(hex)
  if (!rgb) return hex
  return toHex(rgb.map((channel) => channel + (255 - channel) * amount))
}

// Biały lub ciemny tekst, zależnie od jasności tła
export function readableTextColor(hex) {
  const rgb = toRgb(hex)
  if (!rgb) return '#ffffff'

  const [r, g, b] = rgb
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#1e293b' : '#ffffff'
}