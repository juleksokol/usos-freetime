import { describe, expect, it } from 'vitest'
import { SETTINGS_GROUPS } from '../../components/settings/schema'
import { DICTIONARIES, createTranslator } from '../i18n'
import { DEFAULT_SETTINGS } from '../settingsDefaults'
import { filterGroups, sectionMatches } from '../settingsSearch'

const tPl = createTranslator('pl', DICTIONARIES)
const tEn = createTranslator('en', DICTIONARIES)

const allSections = SETTINGS_GROUPS.flatMap((group) => group.sections)
const allRows = allSections.flatMap((section) => section.rows ?? [])

const optionsOf = (row) =>
  typeof row.options === 'function' ? row.options(DEFAULT_SETTINGS) : row.options

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

      const values = optionsOf(row).map((option) => option.value)
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

  it('podsumowania sekcji działają w obu językach', () => {
    for (const section of allSections) {
      if (!section.summary) continue
      expect(typeof section.summary(DEFAULT_SETTINGS, tPl)).toBe('string')
      expect(section.summary(DEFAULT_SETTINGS, tEn)).not.toContain('settings.')
    }
  })

  it('wszystkie teksty ze schematu mają tłumaczenie po polsku i angielsku', () => {
    const keys = []
    for (const group of SETTINGS_GROUPS) keys.push(group.titleKey)
    for (const section of allSections) {
      keys.push(section.titleKey, section.descriptionKey, section.keywordsKey)
    }
    for (const row of allRows) {
      keys.push(row.labelKey, row.hintKey)
      for (const option of optionsOf(row) ?? []) keys.push(option.labelKey)
    }

    for (const key of keys.filter(Boolean)) {
      expect(tPl(key) === key && key).toBe(false)
      expect(tEn(key) === key && key).toBe(false)
    }
  })
})

describe('wyszukiwarka ustawień', () => {
  const ids = (query, t) =>
    filterGroups(SETTINGS_GROUPS, query, t).flatMap((group) =>
      group.sections.map((section) => section.id)
    )

  it('pusta fraza pokazuje wszystko', () => {
    expect(ids('', tPl)).toHaveLength(allSections.length)
    expect(ids('', tEn)).toHaveLength(allSections.length)
  })

  it('znajduje sekcje po nazwie, opisie i wierszach po polsku (bez polskich znaków)', () => {
    expect(ids('ciemny', tPl)).toContain('appearance')
    expect(ids('pompki', tPl)).toEqual(['pushups'])
    expect(ids('usun konto', tPl)).toContain('danger')
    expect(ids('litera wyklad', tPl)).toContain('tiles')
    expect(ids('pora obiadu', tPl)).toContain('slots')
  })

  it('znajduje sekcje po angielsku', () => {
    expect(ids('dark theme', tEn)).toContain('appearance')
    expect(ids('pushups', tEn)).toContain('pushups')
    expect(ids('delete account', tEn)).toContain('danger')
    expect(ids('lunch', tEn)).toContain('slots')
  })

  it('sekcja językowa jest znajdowana w obu językach', () => {
    expect(ids('language', tEn)).toContain('language')
    expect(ids('język', tPl)).toContain('language')
  })

  it('wszystkie wpisane słowa muszą pasować', () => {
    expect(ids('pompki zzzz', tPl)).toEqual([])
    expect(sectionMatches(allSections[0], 'motyw kolor', tPl)).toBe(true)
  })
})
