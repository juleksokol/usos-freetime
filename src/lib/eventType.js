import { normalizeText } from './text'

// Litery znaku wodnego: W = wykład, Ć = ćwiczenia, L = laboratorium, P = projekt,
// S = seminarium, K = konwersatorium, Z = zajęcia zdalne
const KIND_LETTERS = {
  lecture: 'W',
  exercise: 'Ć',
  lab: 'L',
  project: 'P',
  seminar: 'S',
  conversatory: 'K',
}

/**
 * Rozpoznaje rodzaj zajęć po polach "rodzaj" i "miejsce":
 *  kind:    'lecture' | 'exercise' | 'lab' | 'project' | 'seminar' | 'conversatory' | 'other'
 *  remote:  zajęcia zdalne (sala wirtualna, online, Teams itp.)
 *  letters: litery znaku wodnego, np. "W", "Ć", "WZ", "Z" (pusty tekst, gdy nic nie rozpoznano)
 */
export function classifyEvent(event) {
  const type = normalizeText(event.event_type)
  const place = normalizeText(event.location)

  let kind = 'other'
  if (type.includes('wyklad')) kind = 'lecture'
  else if (type.includes('seminar')) kind = 'seminar'
  else if (type.includes('laborator') || /(^| )lab( |$)/.test(type)) kind = 'lab'
  else if (type.includes('projekt')) kind = 'project'
  else if (type.includes('cwiczen') || type.includes('audytoryjn')) kind = 'exercise'
  else if (type.includes('konwersator')) kind = 'conversatory'

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