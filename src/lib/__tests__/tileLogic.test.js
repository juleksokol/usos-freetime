import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classifyEvent, darkenColor } from '../eventType'
import { countWrappedLines } from '../textFit'
import { parseUsosCsv } from '../usosParser'

const fixture = (name) =>
  readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf-8')

const countLetters = (events) => {
  const counts = {}
  events.forEach((event) => {
    const key = classifyEvent(event).letters || '-'
    counts[key] = (counts[key] ?? 0) + 1
  })
  return counts
}

describe('rodzaje zajęć (litery znaku wodnego)', () => {
  it('rozpoznaje wykłady, laboratoria, seminaria i zajęcia zdalne', () => {
    expect(classifyEvent({ event_type: 'Wykład', location: 'B7 1.1' }).letters).toBe('W')
    expect(classifyEvent({ event_type: 'Ćwiczenia laboratoryjne', location: 'C-1' }).letters).toBe('L')
    expect(classifyEvent({ event_type: 'zajęcia seminaryjne', location: 'C-1' }).letters).toBe('S')
    expect(classifyEvent({ event_type: 'wykład', location: 'Wirtualna' }).letters).toBe('WZ')
    expect(classifyEvent({ event_type: null, location: 'Teams' }).letters).toBe('Z')
    expect(classifyEvent({ event_type: 'Ćwiczenia audytoryjne', location: 'A-2' }).letters).toBe('L')
  })

  it('zajęcia innych rodzajów nie dostają litery', () => {
    expect(classifyEvent({ event_type: 'Ćwiczenia audytoryjne', location: 'A-2' }).letters).toBe('')
    expect(classifyEvent({ event_type: 'Ćwiczenia projektowe', location: 'A-2' }).kind).toBe('other')
    expect(classifyEvent({ event_type: null, location: null }).letters).toBe('')
  })

  it('klasyfikuje prawdziwe plany', () => {
    const usos = parseUsosCsv(fixture('plan_zajec_csv.csv')).events
    expect(countLetters(usos)).toEqual({ W: 68, WZ: 10, '-': 59, L: 59, S: 5 })

    const unitime = parseUsosCsv(fixture('events-2.csv')).events
    expect(countLetters(unitime)).toEqual({ W: 72, '-': 83, L: 33 })
  })
})

describe('przyciemnianie koloru (laboratoria)', () => {
  it('daje ciemniejszy odcień w tym samym formacie', () => {
    const dark = darkenColor('#6366f1', 0.28)
    expect(dark).toBe('#4749ae')
    expect(darkenColor('#ffffff', 0.5)).toBe('#808080')
  })

  it('nie zmienia niepoprawnych kolorów', () => {
    expect(darkenColor('zły', 0.5)).toBe('zły')
  })
})

describe('zawijanie nazw na kafelkach', () => {
  const measure = (text) => text.length * 6

  it('liczy linie po zawinięciu słowami', () => {
    expect(countWrappedLines('Algebra', 60, measure)).toBe(1)
    expect(countWrappedLines('Analiza matematyczna I', 60, measure)).toBe(3)
    expect(
      countWrappedLines('Operating Systems Configuration and Administration', 100, measure)
    ).toBe(5)
  })

  it('łamie bardzo długie słowa i obsługuje pusty tekst', () => {
    expect(countWrappedLines('Supercalifragilisticexpialidocious', 60, measure)).toBe(4)
    expect(countWrappedLines('', 60, measure)).toBe(0)
  })
})