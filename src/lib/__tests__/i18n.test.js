import { readFileSync, readdirSync } from 'node:fs'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CHOICES,
  DICTIONARIES,
  createTranslator,
  detectLanguage,
  resolveChoice,
} from '../i18n'

const { pl, en } = DICTIONARIES

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/
const baseKey = (key) => key.replace(PLURAL_SUFFIX, '')
const placeholders = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',')

describe('tłumacz', () => {
  const dictionaries = {
    pl: {
      hello: 'Cześć, {name}!',
      only_pl: 'Tylko po polsku',
      files_one: '{count} plik',
      files_few: '{count} pliki',
      files_many: '{count} plików',
      files_other: '{count} pliku',
    },
    en: {
      hello: 'Hello, {name}!',
      files_one: '{count} file',
      files_other: '{count} files',
    },
  }

  it('wstawia parametry i zostawia nieznane', () => {
    const t = createTranslator('en', dictionaries)
    expect(t('hello', { name: 'Ola' })).toBe('Hello, Ola!')
    expect(t('hello')).toBe('Hello, {name}!')
    expect(t('hello', { name: 0 })).toBe('Hello, 0!')
  })

  it('brakujące tłumaczenie wraca do polskiego, a nieznany klucz do samego klucza', () => {
    const t = createTranslator('en', dictionaries)
    expect(t('only_pl')).toBe('Tylko po polsku')
    expect(t('no.such.key')).toBe('no.such.key')
  })

  it('obsługuje liczbę mnogą w obu językach', () => {
    const tPl = createTranslator('pl', dictionaries)
    expect(tPl('files', { count: 1 })).toBe('1 plik')
    expect(tPl('files', { count: 3 })).toBe('3 pliki')
    expect(tPl('files', { count: 5 })).toBe('5 plików')
    expect(tPl('files', { count: 22 })).toBe('22 pliki')

    const tEn = createTranslator('en', dictionaries)
    expect(tEn('files', { count: 1 })).toBe('1 file')
    expect(tEn('files', { count: 5 })).toBe('5 files')
  })
})

describe('wybór języka', () => {
  it('wykrywa pierwszy obsługiwany język przeglądarki', () => {
    expect(detectLanguage(['pl-PL', 'en'])).toBe('pl')
    expect(detectLanguage(['de-DE', 'en-US'])).toBe('en')
    expect(detectLanguage(['de-DE'])).toBe('en')
    expect(detectLanguage([])).toBe('pl')
  })

  it('zamienia wybór użytkownika na język', () => {
    expect(CHOICES).toEqual(['auto', 'pl', 'en'])
    expect(resolveChoice('pl', ['en-US'])).toBe('pl')
    expect(resolveChoice('en', ['pl-PL'])).toBe('en')
    expect(resolveChoice('auto', ['en-GB'])).toBe('en')
    expect(resolveChoice('klingon', ['en-GB'])).toBe('pl')
  })
})

describe('słowniki PL i EN', () => {
  it('mają te same klucze (z uwzględnieniem form liczby mnogiej)', () => {
    const plBase = [...new Set(Object.keys(pl).map(baseKey))].sort()
    const enBase = [...new Set(Object.keys(en).map(baseKey))].sort()
    expect(enBase.filter((key) => !plBase.includes(key))).toEqual([])
    expect(plBase.filter((key) => !enBase.includes(key))).toEqual([])
  })

  it('żadne tłumaczenie nie jest puste i każdy klucz ma te same parametry w obu językach', () => {
    for (const [key, text] of Object.entries(pl)) {
      expect(text.trim() === '' && key).toBe(false)
      expect(en[key]?.trim() === '' && key).toBe(false)
      if (en[key] !== undefined) {
        expect(`${key}: ${placeholders(en[key])}`).toBe(`${key}: ${placeholders(text)}`)
      }
    }
  })

  it('formy liczby mnogiej są kompletne dla każdego języka', () => {
    for (const [lang, dictionary] of Object.entries(DICTIONARIES)) {
      const categories = new Intl.PluralRules(lang).resolvedOptions().pluralCategories
      const groups = {}
      for (const key of Object.keys(dictionary)) {
        if (PLURAL_SUFFIX.test(key)) (groups[baseKey(key)] ??= []).push(key.match(PLURAL_SUFFIX)[1])
      }
      for (const [base, forms] of Object.entries(groups)) {
        expect(`${lang} ${base}: ${[...categories].sort()}`).toBe(`${lang} ${base}: ${[...forms].sort()}`)
      }
    }
  })

  // Wyjątki: teksty, które celowo cytują polskie litery (np. oznaczenia typów zajęć)
  const POLISH_LETTERS_ALLOWED = new Set(['settings.row.showTypeWatermark.hint'])

  it('angielski nie zawiera polskich liter ani skopiowanych polskich tekstów', () => {
    for (const [key, text] of Object.entries(en)) {
      const hasPolishLetters = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text)
      expect(hasPolishLetters && !POLISH_LETTERS_ALLOWED.has(key) && key).toBe(false)
      expect(text === pl[key] && key).toBe(false)
    }
  })
})

// Sprawdza kod aplikacji: każdy użyty klucz istnieje, a w słowniku nie ma kluczy nieużywanych
describe('klucze tłumaczeń w kodzie', () => {
  const srcDir = fileURLToPath(new URL('../../', import.meta.url))

  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
    )

  const files = walk(srcDir).filter(
    (file) =>
      /\.(jsx?|mjs)$/.test(file) &&
      !file.includes(`${sep}__tests__${sep}`) &&
      !file.includes(`${sep}__run__${sep}`) &&
      !file.includes(`${sep}i18n${sep}`)
  )

  const prefixes = [...new Set(Object.keys(pl).map((key) => key.split('.')[0]))]
  const literal = new RegExp(`(['"\`])((?:${prefixes.join('|')})\\.[A-Za-z0-9_.]+)\\1`, 'g')

  const used = new Set()
  for (const file of files) {
    for (const match of readFileSync(file, 'utf-8').matchAll(literal)) used.add(match[2])
  }

  const exists = (key) => key in pl || `${key}_other` in pl

  it('każdy klucz użyty w kodzie ma tłumaczenie', () => {
    expect([...used].filter((key) => !exists(key))).toEqual([])
  })

  it('w słowniku nie ma kluczy, których kod nie używa', () => {
    const baseKeys = [...new Set(Object.keys(pl).map(baseKey))]
    expect(baseKeys.filter((key) => !used.has(key))).toEqual([])
  })
})
