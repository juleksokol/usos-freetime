import { describe, expect, it } from 'vitest'
import { findConflicts, groupConflicts } from '../conflicts'
import { findCommonFreeSlots } from '../freeSlots'
import { diffImports, hasChanges } from '../importDiff'
import { layoutColumns } from '../layout'
import { computePushups } from '../pushups'
import { memberStatus, nextCommonSlot } from '../presence'
import { getDueReminders, weekMarkers } from '../tests'

const event = (day, start, end, extra = {}) => ({
  day_of_week: day,
  start_time: start,
  end_time: end,
  ...extra,
})

describe('wspólne okienka', () => {
  it('znajduje luki między zajęciami wszystkich osób', () => {
    const slots = findCommonFreeSlots(
      [event(1, '08:00', '09:30'), event(1, '09:00', '10:00'), event(1, '12:00', '13:00')],
      { dayStartMin: 480, dayEndMin: 840, minDuration: 45, days: [1] }
    )
    expect(slots).toEqual([
      { day: 1, startMin: 600, endMin: 720 },
      { day: 1, startMin: 780, endMin: 840 },
    ])
  })

  it('pomija luki krótsze niż minimalna długość', () => {
    const slots = findCommonFreeSlots(
      [event(2, '08:00', '09:00'), event(2, '09:30', '11:00')],
      { dayStartMin: 480, dayEndMin: 660, minDuration: 45, days: [2] }
    )
    expect(slots).toHaveLength(0)
  })
})

describe('obecność ("kto jest wolny teraz")', () => {
  const day = [
    event(1, '09:00', '10:30', { title: 'A' }),
    event(1, '10:30', '12:00', { title: 'B' }),
    event(1, '14:00', '15:00', { title: 'C' }),
  ]

  it('zajęcia "na styk" przedłużają zajętość', () => {
    expect(memberStatus(day, 570)).toEqual({ busy: true, until: 720, title: 'A' })
  })

  it('wolna osoba widzi początek najbliższych zajęć', () => {
    expect(memberStatus(day, 750)).toEqual({ busy: false, until: 840, title: 'C' })
    expect(memberStatus(day, 960).until).toBeNull()
  })

  it('wyznacza najbliższe wspólne okienko od chwili obecnej', () => {
    const slot = nextCommonSlot(day, 750, { endMin: 1200, minDuration: 45, day: 1 })
    expect(slot).toEqual({ day: 1, startMin: 750, endMin: 840 })
  })
})

describe('kolizje własnych wydarzeń', () => {
  const classes = [
    event(1, '09:45', '11:15', { id: 'k1', title: 'Algebra', event_date: '2026-10-05' }),
    event(1, '09:45', '11:15', { id: 'k2', title: 'Algebra', event_date: '2026-10-12' }),
  ]

  it('wykrywa zderzenie z zajęciami', () => {
    const fields = {
      event_date: '2026-10-05',
      day_of_week: 1,
      start_time: '10:00',
      end_time: '11:00',
    }
    expect(findConflicts(fields, classes)).toHaveLength(1)
  })

  it('styk godzin (koniec = początek) nie jest kolizją', () => {
    const fields = {
      event_date: '2026-10-05',
      day_of_week: 1,
      start_time: '11:15',
      end_time: '12:00',
    }
    expect(findConflicts(fields, classes)).toHaveLength(0)
  })

  it('łączy kolizje z tymi samymi zajęciami w jedną pozycję', () => {
    const fields = {
      event_date: null,
      valid_from: '2026-10-05',
      valid_until: '2026-10-26',
      day_of_week: 1,
      start_time: '10:00',
      end_time: '11:00',
    }
    const conflicts = findConflicts(fields, classes)
    expect(conflicts).toHaveLength(2)
    expect(groupConflicts(conflicts)).toHaveLength(1)
  })
})

describe('sprawdziany', () => {
  const tests = [
    { id: 't1', subject: 'Algebra', kind: 'exam', test_date: '2026-10-12', start_time: '09:00:00', end_time: '10:30:00', reminder: true },
    { id: 't2', subject: 'Fizyka', kind: 'colloquium', test_date: '2026-10-11', start_time: '14:00:00', end_time: '15:00:00', reminder: true },
    { id: 't3', subject: 'Geodezja', kind: 'quiz', test_date: '2026-10-12', start_time: '12:00:00', end_time: '12:15:00', reminder: false },
  ]
  const due = (iso) =>
    getDueReminders(tests, new Date(iso), 18).map((item) => `${item.test.subject}/${item.when}`)

  it('przypomina dzień przed od ustalonej godziny', () => {
    expect(due('2026-10-11T17:59:00')).toEqual([])
    expect(due('2026-10-11T18:00:00')).toContain('Algebra/tomorrow')
  })

  it('przypomina w dniu sprawdzianu tylko przed jego początkiem', () => {
    expect(due('2026-10-12T07:30:00')).toEqual(['Algebra/today'])
    expect(due('2026-10-12T09:30:00')).toEqual([])
  })

  it('pomija sprawdziany z wyłączonym przypomnieniem', () => {
    expect(due('2026-10-12T08:00:00')).not.toContain('Geodezja/today')
  })

  it('oznacza przedmioty ze sprawdzianem w danym tygodniu (egzamin ważniejszy od kolokwium)', () => {
    const markers = weekMarkers(
      [...tests, { id: 't4', subject: 'Algebra', kind: 'colloquium', test_date: '2026-10-14', start_time: '10:00:00', end_time: '11:00:00', reminder: true }],
      '2026-10-12'
    )
    expect(markers.Algebra.color).toBe('#ef4444')
    expect(markers.Geodezja.color).toBe('#22c55e')
    expect(markers.Fizyka).toBeUndefined()
  })
})

describe('układ nakładających się kafelków', () => {
  it('rozdziela nakładające się zajęcia na kolumny', () => {
    const items = [
      { id: 'A', start: 480, end: 570 },
      { id: 'B', start: 540, end: 600 },
      { id: 'C', start: 720, end: 780 },
    ]
    const laid = layoutColumns(items)
    const byId = Object.fromEntries(laid.map((item) => [item.id, item]))
    expect([byId.A.col, byId.A.cols]).toEqual([0, 2])
    expect([byId.B.col, byId.B.cols]).toEqual([1, 2])
    expect([byId.C.col, byId.C.cols]).toEqual([0, 1])
  })
})

describe('licznik pompek', () => {
  const config = { startDate: '2026-10-04', startCount: 30, increment: 5 }

  it('rośnie o przyrost co 7 dni', () => {
    expect(computePushups(config, '2026-10-04').count).toBe(30)
    expect(computePushups(config, '2026-10-10').count).toBe(30)
    expect(computePushups(config, '2026-10-11').count).toBe(35)
    expect(computePushups(config, '2026-10-18').count).toBe(40)
  })

  it('przed startem pokazuje wartość początkową', () => {
    const info = computePushups(config, '2026-10-01')
    expect(info.started).toBe(false)
    expect(info.nextIn).toBe(3)
  })
})

describe('porównanie importów', () => {
  const base = (id, date, start, title, location = 'A-1') => ({
    id,
    title,
    event_date: date,
    day_of_week: 1,
    start_time: start,
    end_time: '11:00',
    location,
  })

  const oldEvents = [
    base('1', '2026-10-05', '09:00', 'Algebra'),
    base('2', '2026-10-12', '09:00', 'Algebra'),
    base('3', '2026-10-19', '09:00', 'Algebra'),
    base('4', '2026-10-05', '12:00', 'Fizyka'),
  ]

  it('rozpoznaje brak zmian (godziny z bazy mają sekundy)', () => {
    const sameWithSeconds = oldEvents.map((item) => ({
      ...item,
      start_time: `${item.start_time}:00`,
      end_time: `${item.end_time}:00`,
    }))
    const diff = diffImports(sameWithSeconds, oldEvents)
    expect(diff.unchanged).toBe(4)
    expect(hasChanges(diff)).toBe(false)
  })

  it('rozpoznaje zmianę sali, przesunięcie, dodanie i usunięcie', () => {
    const newEvents = [
      base('a', '2026-10-05', '09:00', 'Algebra', 'B-2'), // zmieniona sala
      base('b', '2026-10-13', '09:00', 'Algebra'), // przesunięte z 12.10 na 13.10
      base('c', '2026-10-19', '09:00', 'Algebra'), // bez zmian
      base('d', '2026-10-06', '08:00', 'Nowy przedmiot'), // dodane
      // Fizyka 5.10 usunięta
    ]
    const diff = diffImports(oldEvents, newEvents)
    expect(diff.unchanged).toBe(1)
    expect(diff.changed).toHaveLength(1)
    expect(diff.moved).toHaveLength(1)
    expect(diff.moved[0].from.event_date).toBe('2026-10-12')
    expect(diff.moved[0].to.event_date).toBe('2026-10-13')
    expect(diff.added).toHaveLength(1)
    expect(diff.removed).toHaveLength(1)
    expect(diff.removed[0].title).toBe('Fizyka')
  })
})