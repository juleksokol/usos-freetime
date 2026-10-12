import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { nextOccurrence, searchPlan } from '../search'
import { suggestAbbreviation } from '../subjects'
import { parseUsosCsv } from '../usosParser'

const fixture = (name) =>
  readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf-8')

const withIds = (events) =>
  events.map((event, index) => ({ ...event, id: `e${index}`, source: 'import' }))

describe('wyszukiwarka planu', () => {
  const usos = withIds(parseUsosCsv(fixture('plan_zajec_csv.csv')).events)
  const unitime = withIds(parseUsosCsv(fixture('events-2.csv')).events)
  const today = '2026-10-05'

  it('znajduje przedmiot i pokazuje najbliższe terminy', () => {
    const result = searchPlan(usos, [], 'algebra', today)
    expect(result.subjects).toHaveLength(1)
    expect(result.subjects[0].subject).toBe('Algebra')
    expect(result.subjects[0].count).toBe(30)
    expect(result.subjects[0].next.date).toBe('2026-10-05')
    expect(result.subjects[0].next.event.start_time).toBe('09:45')

    const firstDates = result.occurrences
      .slice(0, 3)
      .map((item) => `${item.date} ${item.event.start_time}`)
    expect(firstDates).toEqual(['2026-10-05 09:45', '2026-10-05 13:15', '2026-10-12 09:45'])
  })

  it('szuka po prowadzącym (bez względu na wielkość liter i polskie znaki)', () => {
    const result = searchPlan(usos, [], 'BUŁAT', today)
    expect(result.subjects).toHaveLength(1)
    expect(result.subjects[0].subject).toBe('Principles of Programming')
    expect(result.subjects[0].count).toBe(14)
    expect(searchPlan(usos, [], 'bulat', today).subjects).toHaveLength(1)
  })

  it('wszystkie wpisane słowa muszą pasować', () => {
    expect(searchPlan(usos, [], 'algebra b7', today).subjects).toHaveLength(1)
    expect(searchPlan(usos, [], 'algebra zzzz', today).subjects).toHaveLength(0)
  })

  it('zwraca null dla pustego zapytania', () => {
    expect(searchPlan(usos, [], '   ', today)).toBeNull()
  })

  it('działa na planie z UniTime', () => {
    const result = searchPlan(unitime, [], 'geodezja', today)
    expect(result.subjects.map((item) => item.subject)).toEqual(['Geodezja Ia'])
    expect(searchPlan(unitime, [], 'gornictwa', today).subjects).toHaveLength(1)
  })

  it('znajduje własne cykliczne wydarzenia i sprawdziany po notatkach', () => {
    const custom = {
      id: 'c1',
      source: 'custom',
      title: 'Siłownia',
      event_date: null,
      valid_from: '2026-10-06',
      valid_until: '2026-12-15',
      day_of_week: 2,
      start_time: '18:00:00',
      end_time: '19:30:00',
      location: 'Hala',
      teacher: null,
      event_type: 'Własne',
    }
    const test = {
      id: 't1',
      subject: 'Algebra',
      title: null,
      notes: 'Rozdziały 1-5 i wzory',
      location: null,
      test_date: '2026-10-12',
    }

    const result = searchPlan([custom], [test], 'silownia', today)
    expect(result.subjects).toHaveLength(0)
    expect(result.occurrences.map((item) => item.date)).toEqual(['2026-10-06'])

    expect(searchPlan([], [test], 'WZORY', today).tests).toHaveLength(1)
  })

  it('wyznacza następny termin zajęć cyklicznych i pomija miniony jednorazowy', () => {
    const weekly = { day_of_week: 3, event_date: null, valid_from: null, valid_until: null }
    expect(nextOccurrence(weekly, '2026-10-05')).toBe('2026-10-07')
    expect(nextOccurrence({ ...weekly, event_date: '2026-10-01' }, '2026-10-05')).toBeNull()
  })
})

describe('skróty przedmiotów', () => {
  it('składa skrót z pierwszych liter, pomijając spójniki', () => {
    expect(suggestAbbreviation('Analiza matematyczna I')).toBe('AMI')
    expect(suggestAbbreviation('Prawo dla geodetów')).toBe('PG')
    expect(suggestAbbreviation('Wychowanie Fizyczne 1')).toBe('WF1')
    expect(suggestAbbreviation('Mathematical Analysis 1')).toBe('MA1')
    expect(suggestAbbreviation('Geodezja Ia')).toBe('GIA')
  })

  it('nazwa z jednego słowa daje jego początek', () => {
    expect(suggestAbbreviation('Algebra')).toBe('ALG')
  })

  it('rozróżnia zajęte skróty', () => {
    const taken = new Set(['PG'])
    expect(suggestAbbreviation('Podstawy górnictwa', taken)).toBe('POG')
    expect(suggestAbbreviation('Podstawy górnictwa', new Set(['PG', 'POG']))).toBe('PG2')
  })
})