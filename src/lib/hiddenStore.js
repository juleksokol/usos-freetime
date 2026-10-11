import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { eventsForWeek, eventsOnDate } from './dateUtils'
import { parseIcs } from './icsParser'
import { parseUsosCsv } from './usosParser'

// Prawdziwe pliki jako wzorce (katalog src/lib/__fixtures__)
const fixture = (name) =>
  readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf-8')

describe('CSV z USOS (plan_zajec_csv.csv)', () => {
  const result = parseUsosCsv(fixture('plan_zajec_csv.csv'))

  it('rozpoznaje wszystkie zajęcia bez ostrzeżeń', () => {
    expect(result.error).toBeNull()
    expect(result.events).toHaveLength(201)
    expect(result.warnings).toHaveLength(0)
  })

  it('zapisuje konkretne daty (bez zajęć cyklicznych)', () => {
    expect(result.events.every((event) => event.event_date)).toBe(true)
    expect(result.events.some((event) => event.valid_from)).toBe(false)
    expect(result.events[0].event_date).toBe('2026-10-01')
    expect(result.events.at(-1).event_date).toBe('2027-01-27')
  })

  it('liczy zajęcia w poszczególnych dniach tygodnia', () => {
    const perDay = {}
    result.events.forEach((event) => {
      perDay[event.day_of_week] = (perDay[event.day_of_week] ?? 0) + 1
    })
    expect(perDay).toEqual({ 1: 59, 2: 46, 3: 28, 4: 24, 5: 44 })
  })

  it('składa lokalizację z budynku i sali', () => {
    const monday = eventsOnDate(result.events, '2026-10-05')
    expect(monday).toHaveLength(4)

    const algebra = monday.find((event) => event.start_time === '09:45')
    expect(algebra.title).toBe('Algebra')
    expect(algebra.end_time).toBe('11:15')
    expect(algebra.location).toBe('B7 1.1')
  })
})

describe('CSV z UniTime (events-2.csv, cały semestr)', () => {
  const result = parseUsosCsv(fixture('events-2.csv'))

  it('rozpoznaje wszystkie terminy bez ostrzeżeń', () => {
    expect(result.error).toBeNull()
    expect(result.events).toHaveLength(188)
    expect(result.warnings).toHaveLength(0)
    expect(result.events[0].event_date).toBe('2026-10-01')
    expect(result.events.at(-1).event_date).toBe('2027-01-28')
  })

  it('zamienia serie na konkretne daty (bez powielania w kolejnych tygodniach)', () => {
    expect(result.events.every((event) => event.event_date)).toBe(true)
    expect(result.events.some((event) => event.valid_from)).toBe(false)

    const weeks = [
      ['2026-10-05', 14],
      ['2026-10-12', 12],
      ['2026-11-09', 11],
      ['2027-02-01', 0],
      ['2027-03-01', 0],
    ]
    for (const [week, count] of weeks) {
      expect(eventsForWeek(result.events, week)).toHaveLength(count)
    }
  })

  it('obsługuje sklejone dni "ŚrCz" (święto 6.01 przesuwa zajęcia na czwartek)', () => {
    expect(eventsOnDate(result.events, '2027-01-06')).toHaveLength(0)
    expect(eventsOnDate(result.events, '2027-01-07')).toHaveLength(3)
    expect(eventsOnDate(result.events, '2027-01-13')).toHaveLength(3)
  })

  it('rozwija skróty rodzajów zajęć', () => {
    const types = new Set(result.events.map((event) => event.event_type))
    expect(types.has('Ćwiczenia audytoryjne')).toBe(true)
    expect(types.has('Ćwiczenia laboratoryjne')).toBe(true)
    expect(types.has('CWA')).toBe(false)
  })
})

describe('CSV z UniTime (events.csv, jeden tydzień)', () => {
  const result = parseUsosCsv(fixture('events.csv'))

  it('pusty "Ostatni dzień" oznacza pojedyncze spotkanie, a nie zajęcia co tydzień', () => {
    expect(result.events).toHaveLength(14)
    expect(eventsForWeek(result.events, '2026-10-05')).toHaveLength(14)
    expect(eventsForWeek(result.events, '2026-10-12')).toHaveLength(0)
  })
})

describe('Reguły UniTime na małych przykładach', () => {
  const header =
    'Tytuł,Typ,Dzień tygodnia,Pierwszy dzień,Ostatni dzień,Ogłoszony początek,Ogłoszony koniec,Miejsce,Prowadzący / Odpowiedzialny'

  it('brak ostatniego dnia daje jedno spotkanie', () => {
    const csv = `${header}\nAlgebra,Wykład,Pt,2.10.2026,,8:00,9:30,B7 1.1,dr X`
    const { events } = parseUsosCsv(csv)
    expect(events).toHaveLength(1)
    expect(events[0].event_date).toBe('2026-10-02')
    expect(events[0].start_time).toBe('08:00')
  })

  it('pierwszy i ostatni dzień dają serię tygodniową', () => {
    const csv = `${header}\nFizyka,CWA,Pn,5.10.2026,26.10.2026,9:45,11:15,C-1,dr Y`
    const { events } = parseUsosCsv(csv)
    expect(events.map((event) => event.event_date)).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ])
    expect(events[0].event_type).toBe('Ćwiczenia audytoryjne')
  })

  it('kilka dni w jednym polu daje właściwe daty', () => {
    const csv = `${header}\nBazy,CWL,ŚrCz,7.1.2027,13.1.2027,14:00,15:30,Lab,dr Z`
    const { events } = parseUsosCsv(csv)
    expect(events.map((event) => [event.event_date, event.day_of_week])).toEqual([
      ['2027-01-07', 4],
      ['2027-01-13', 3],
    ])
  })

  it('plan bez dat (tylko dzień tygodnia) jest szablonem na każdy tydzień', () => {
    const csv =
      'Dzień;Godzina rozpoczęcia;Godzina zakończenia;Przedmiot\nPoniedziałek;08:00;09:30;Analiza'
    const { events } = parseUsosCsv(csv)
    expect(events).toHaveLength(1)
    expect(events[0].event_date).toBeNull()
    expect(events[0].day_of_week).toBe(1)
  })

  it('zgłasza błąd dla pliku bez rozpoznawalnych kolumn', () => {
    const { error } = parseUsosCsv('a,b,c\n1,2,3')
    expect(error).toContain('Nie rozpoznano kolumn')
  })
})

describe('iCal (.ics)', () => {
  const wrap = (body) =>
    ['BEGIN:VCALENDAR', 'VERSION:2.0', body, 'END:VCALENDAR'].join('\r\n')

  it('przelicza czas UTC na polski (lato i zima)', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:a',
        'DTSTART:20261006T080000Z',
        'DTEND:20261006T093000Z',
        'SUMMARY:Lato',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:b',
        'DTSTART:20261201T090000Z',
        'DTEND:20261201T103000Z',
        'SUMMARY:Zima',
        'END:VEVENT',
      ].join('\r\n')
    )
    const { events } = parseIcs(ics)
    const summer = events.find((event) => event.title === 'Lato')
    const winter = events.find((event) => event.title === 'Zima')
    expect([summer.start_time, summer.end_time]).toEqual(['10:00', '11:30'])
    expect([winter.start_time, winter.end_time]).toEqual(['10:00', '11:30'])
  })

  it('zwykłe powtarzanie co tydzień zapisuje jako zajęcia cykliczne', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:c',
        'DTSTART;TZID=Europe/Warsaw:20261007T130000',
        'DTEND;TZID=Europe/Warsaw:20261007T143000',
        'RRULE:FREQ=WEEKLY;UNTIL=20261230T000000Z',
        'SUMMARY:Fizyka',
        'END:VEVENT',
      ].join('\r\n')
    )
    const { events } = parseIcs(ics)
    expect(events).toHaveLength(1)
    expect(events[0].valid_from).toBe('2026-10-07')
    expect(events[0].valid_until).toBe('2026-12-30')
    expect(events[0].day_of_week).toBe(3)
  })

  it('co 2 tygodnie z kilkoma dniami rozwija na pojedyncze daty', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:d',
        'DTSTART;TZID=Europe/Warsaw:20261006T150000',
        'DTEND;TZID=Europe/Warsaw:20261006T163000',
        'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=5',
        'SUMMARY:Lab',
        'END:VEVENT',
      ].join('\r\n')
    )
    const { events } = parseIcs(ics)
    expect(events.map((event) => event.event_date)).toEqual([
      '2026-10-06',
      '2026-10-08',
      '2026-10-20',
      '2026-10-22',
      '2026-11-03',
    ])
  })

  it('uwzględnia wyjątki (EXDATE) i zmienione wystąpienia', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:e',
        'DTSTART;TZID=Europe/Warsaw:20261008T080000',
        'DTEND;TZID=Europe/Warsaw:20261008T093000',
        'RRULE:FREQ=WEEKLY;COUNT=4',
        'EXDATE;TZID=Europe/Warsaw:20261015T080000',
        'SUMMARY:Seminarium',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:e',
        'RECURRENCE-ID;TZID=Europe/Warsaw:20261022T080000',
        'DTSTART;TZID=Europe/Warsaw:20261022T100000',
        'DTEND;TZID=Europe/Warsaw:20261022T113000',
        'SUMMARY:Seminarium',
        'END:VEVENT',
      ].join('\r\n')
    )
    const { events } = parseIcs(ics)
    expect(events.map((event) => `${event.event_date} ${event.start_time}`)).toEqual([
      '2026-10-08 08:00',
      '2026-10-22 10:00',
      '2026-10-29 08:00',
    ])
  })

  it('pomija odwołane i całodniowe wydarzenia z ostrzeżeniem', () => {
    const ics = wrap(
      [
        'BEGIN:VEVENT',
        'UID:f',
        'STATUS:CANCELLED',
        'DTSTART:20261009T100000Z',
        'DTEND:20261009T110000Z',
        'SUMMARY:Odwołane',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:g',
        'DTSTART;VALUE=DATE:20261111',
        'SUMMARY:Święto',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:h',
        'DTSTART;TZID=Europe/Warsaw:20261012T120000',
        'DTEND;TZID=Europe/Warsaw:20261012T130000',
        'SUMMARY:Zwykłe',
        'END:VEVENT',
      ].join('\r\n')
    )
    const { events, warnings } = parseIcs(ics)
    expect(events).toHaveLength(1)
    expect(warnings).toHaveLength(2)
  })
})