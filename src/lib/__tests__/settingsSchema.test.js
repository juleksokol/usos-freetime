import { describe, expect, it } from 'vitest'
import { SETTINGS_GROUPS } from '../../components/settings/schema'
import { DEFAULT_SETTINGS } from '../settingsDefaults'
import { filterGroups, sectionMatches } from '../settingsSearch'

const allSections = SETTINGS_GROUPS.flatMap((group) => group.sections)
const allRows = allSections.flatMap((section) => section.rows ?? [])

describe('opis ustawień (schemat)', () => {
  it('sekcje i grupy mają unikalne identyfikatory', () => {
    const sectionIds = allSections.map((section) => section.id)
    expect(new Set(sectionIds).size).toBe(sectionIds.length)

    const groupIds = SETTINGS_GROUPS.map((group) => group.id)
    expect(new Set(groupIds).size).toBe(groupIds.length)
  })

  it('każdy wiersz dotyczy istniejącego ustawienia', () => {
    for (const row of allRows) {
      expect(row.key in DEFAULT_SETTINGS).toBe(true)
    }
  })

  it('wartości domyślne występują na listach opcji', () => {
    for (const row of allRows) {
      if (!row.options) continue

      const options = typeof row.options === 'function' ? row.options(DEFAULT_SETTINGS) : row.options
      const values = options.map((option) => option.value)
      expect(values).toContain(DEFAULT_SETTINGS[row.key])
    }
  })

  it('przełączniki dotyczą wartości logicznych, a pola liczbowe mają zakres', () => {
    for (const row of allRows) {
      if (row.type === 'switch') expect(typeof DEFAULT_SETTINGS[row.key]).toBe('boolean')
      if (row.type === 'number') {
        expect(typeof row.min).toBe('number')
        expect(typeof row.max).toBe('number')
      }
    }
  })

  it('godzina końca obiadu zawsze jest późniejsza niż początek', () => {
    const start = allRows.find((row) => row.key === 'lunchStart')
    const end = allRows.find((row) => row.key === 'lunchEnd')

    const patch = start.patch(14, { ...DEFAULT_SETTINGS, lunchEnd: 12 })
    expect(patch).toEqual({ lunchStart: 14, lunchEnd: 15 })

    const options = end.options({ ...DEFAULT_SETTINGS, lunchStart: 14 }).map((option) => option.value)
    expect(options.every((hour) => hour > 14)).toBe(true)
  })

  it('podsumowania sekcji działają dla ustawień domyślnych', () => {
    for (const section of allSections) {
      if (section.summary) expect(typeof section.summary(DEFAULT_SETTINGS)).toBe('string')
    }
  })
})

describe('wyszukiwarka ustawień', () => {
  const ids = (query) =>
    filterGroups(SETTINGS_GROUPS, query).flatMap((group) => group.sections.map((section) => section.id))

  it('pusta fraza pokazuje wszystko', () => {
    expect(ids('')).toHaveLength(allSections.length)
  })

  it('znajduje sekcje po nazwie, opisie i wierszach (bez polskich znaków)', () => {
    expect(ids('ciemny')).toContain('appearance')
    expect(ids('pompki')).toEqual(['pushups'])
    expect(ids('usun konto')).toContain('danger')
    expect(ids('litera wyklad')).toContain('tiles')
    expect(ids('pora obiadu')).toContain('slots')
  })

  it('wszystkie wpisane słowa muszą pasować', () => {
    expect(ids('pompki zzzz')).toEqual([])
    expect(sectionMatches(allSections[0], 'motyw kolor')).toBe(true)
  })
})