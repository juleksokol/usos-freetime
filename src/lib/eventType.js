import { normalizeText } from './text'

// Litery znaku wodnego: W = wykład, L = laboratorium, S = seminarium, Z = zajęcia zdalne
const KIND_LETTERS = { lecture: 'W', lab: 'L', seminar: 'S' }

/**
 * Rozpoznaje rodzaj zajęć po polach "rodzaj" i "miejsce":
 *  kind:    'lecture' | 'lab' | 'seminar' | 'other'
 *  remote:  zajęcia zdalne (sala wirtualna, online, Teams itp.)
 *  letters: litery znaku wodnego, np. "W", "L", "WZ", "Z" (pusty tekst, gdy nic nie rozpoznano)
 */
export function classifyEvent(event) {
  const type = normalizeText(event.event_type)
  const place = normalizeText(event.location)

  let kind = 'other'
  if (type.includes('wyklad')) kind = 'lecture'
  else if (type.includes('seminar')) kind = 'seminar'
  else if (type.includes('laborator') || /(^| )lab( |$)/.test(type)) kind = 'lab'

  const remote =
    /wirtual|online|zdaln|teams|zoom|(^| )meet( |$)/.test(place) ||
    /zdaln|online|wirtual/.test(type)

  const letters = `${KIND_LETTERS[kind] ?? ''}${remote ? 'Z' : ''}`

  return { kind, remote, letters }
}

// Przyciemnia kolor #rrggbb o podaną część (0-1)
export function darkenColor(hex, amount) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!match) return hex

  const value = parseInt(match[1], 16)
  const channel = (shift) =>
    Math.round(((value >> shift) & 255) * (1 - amount))
      .toString(16)
      .padStart(2, '0')

  return `#${channel(16)}${channel(8)}${channel(0)}`
}