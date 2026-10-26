import { describe, expect, it } from 'vitest'
import { DICTIONARIES, createTranslator } from '../i18n'
import {
  dayName,
  formatCountdown,
  formatDate,
  formatDayMonth,
  formatLongDate,
  formatWeekRange,
  shortMonth,
  testDisplayName,
  weekdayNumber,
} from '../localeFormat'

const tPl = createTranslator('pl', DICTIONARIES)
const tEn = createTranslator('en', DICTIONARIES)

describe('daty i dni tygodnia zależne od języka', () => {
  it('numer dnia tygodnia liczy od poniedziałku', () => {
    expect(weekdayNumber('2026-10-19')).toBe(1) // poniedziałek
    expect(weekdayNumber('2026-10-21')).toBe(3) // środa
    expect(weekdayNumber('2026-10-25')).toBe(7) // niedziela
  })

  it('nazwy dni po polsku i angielsku', () => {
    expect(dayName(1, 'pl-PL')).toBe('Poniedziałek')
    expect(dayName(7, 'pl-PL')).toBe('Niedziela')
    expect(dayName(3, 'en-GB')).toBe('Wednesday')
    expect(dayName(5, 'en-GB', 'short')).toBe('Fri')
  })

  it('formaty dat', () => {
    expect(formatDate('2026-10-20', 'pl-PL')).toBe('20.10.2026')
    expect(formatDate('2026-10-20', 'en-GB')).toBe('20/10/2026')
    expect(formatDayMonth('2026-10-05', 'pl-PL')).toBe('05.10')
    expect(formatDayMonth('2026-10-05', 'en-GB')).toBe('05/10')
    expect(formatLongDate('2026-10-20', 'pl-PL')).toBe('Wtorek 20.10.2026')
    expect(formatLongDate('2026-10-20', 'en-GB')).toBe('Tuesday 20/10/2026')
  })

  it('zakres tygodnia i skrót miesiąca', () => {
    expect(formatWeekRange('2026-10-19', 'pl-PL')).toBe('19.10.2026 – 23.10.2026')
    expect(formatWeekRange('2026-10-19', 'en-GB')).toBe('19/10/2026 – 23/10/2026')
    expect(shortMonth('2026-10-05', 'pl-PL')).toBe('paź')
    expect(shortMonth('2026-01-05', 'en-GB')).toBe('Jan')
  })

  it('zakres tygodnia przechodzi przez granicę miesiąca i roku', () => {
    expect(formatWeekRange('2026-12-28', 'pl-PL')).toBe('28.12.2026 – 01.01.2027')
  })
})

describe('odliczanie i liczba mnoga', () => {
  it('odliczanie po polsku', () => {
    expect(formatCountdown(-1, tPl)).toBe('minęło')
    expect(formatCountdown(0, tPl)).toBe('dziś')
    expect(formatCountdown(1, tPl)).toBe('jutro')
    expect(formatCountdown(2, tPl)).toBe('za 2 dni')
    expect(formatCountdown(5, tPl)).toBe('za 5 dni')
    expect(formatCountdown(22, tPl)).toBe('za 22 dni')
  })

  it('odliczanie po angielsku', () => {
    expect(formatCountdown(0, tEn)).toBe('today')
    expect(formatCountdown(1, tEn)).toBe('tomorrow')
    expect(formatCountdown(3, tEn)).toBe('in 3 days')
  })

  it('liczba osób w karcie „Kto jest wolny teraz”', () => {
    expect(tPl('free.count', { count: 1, free: 1 })).toBe('1 z 1 osoby wolnych')
    expect(tPl('free.count', { count: 3, free: 2 })).toBe('2 z 3 osób wolnych')
    expect(tPl('free.count', { count: 12, free: 5 })).toBe('5 z 12 osób wolnych')
    expect(tEn('free.count', { count: 1, free: 1 })).toBe('1 of 1 person free')
    expect(tEn('free.count', { count: 4, free: 2 })).toBe('2 of 4 people free')
  })

  it('zdania o wyzwaniu mają poprawne formy dni', () => {
    const args = { date: '27.10.2026', next: 35 }
    expect(tPl('pushups.next', { ...args, count: 1 })).toBe('Za 1 dzień (27.10.2026) będzie 35 dziennie.')
    expect(tPl('pushups.next', { ...args, count: 3 })).toBe('Za 3 dni (27.10.2026) będzie 35 dziennie.')
    expect(tPl('pushups.startsIn', { date: '27.10.2026', count: 7 })).toBe(
      'Wyzwanie startuje za 7 dni (27.10.2026).'
    )
    expect(tEn('pushups.next', { ...args, count: 1 })).toBe('In 1 day (27.10.2026) it will be 35 a day.')
    expect(tEn('pushups.startsIn', { date: '27/10/2026', count: 7 })).toBe(
      'The challenge starts in 7 days (27/10/2026).'
    )
  })
})

describe('nazwy sprawdzianów', () => {
  it('własny tytuł ma pierwszeństwo, w przeciwnym razie nazwa rodzaju', () => {
    expect(testDisplayName({ kind: 'exam', title: ' Poprawka ' }, tPl)).toBe('Poprawka')
    expect(testDisplayName({ kind: 'exam', title: '' }, tPl)).toBe('Egzamin')
    expect(testDisplayName({ kind: 'colloquium' }, tEn)).toBe('Colloquium')
    expect(testDisplayName({ kind: 'cos-innego' }, tEn)).toBe('Quiz / other')
  })
})
