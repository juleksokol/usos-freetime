import { describe, expect, it } from 'vitest'
import { buildIcs, buildJsonExport, warsawToUtcMs } from '../exportData'
import { parseIcs } from '../icsParser'

const iso = (ms) => new Date(ms).toISOString()

describe('czas polski -> UTC', () => {
  it('uwzględnia czas letni i zimowy', () => {
    expect(iso(warsawToUtcMs('2026-10-05', '09:45'))).toBe('2026-10-05T07:45:00.000Z')
    expect(iso(warsawToUtcMs('2026-12-01', '10:00'))).toBe('2026-12-01T09:00:00.000Z')
  })

  it('poprawnie obsługuje dzień zmiany czasu', () => {
    expect(iso(warsawToUtcMs('2027-03-28', '03:30'))).toBe('2027-03-28T01:30:00.000Z')
  })
})

describe('eksport kalendarza (.ics)', () => {
  const events = [
    {
      id: 'e1',
      title: 'Algebra, wykład',
      event_date: '2026-10-05',
      valid_from: null,
      valid_until: null,
      day_of_week: 1,
      start_time: '09:45:00',
      end_time: '11:15:00',
      location: 'B7 1.1',
      teacher: 'dr X',
      event_type: 'Wykład',
    },
    {
      id: 'e2',
      title: 'Siłownia; trening',
      event_date: null,
      valid_from: '2026-10-06',
      valid_until: '2026-12-15',
      day_of_week: 2,
      start_time: '18:00:00',
      end_time: '19:30:00',
      location: 'Hala',
      teacher: null,
      event_type: 'Własne',
    },
  ]
  const tests = [
    {
      id: 't1',
      kind: 'exam',
      subject: 'Algebra',
      title: null,
      test_date: '2027-01-20',
      start_time: '09:00:00',
      end_time: '10:30:00',
      location: 'C-4 301',
      notes: 'Rozdziały 1-5,\nwzory',
      result: null,
      reminder: true,
    },
  ]

  const ics = buildIcs(events, tests, new Date('2026-10-04T10:00:00Z'))

  it('zawiera nagłówek kalendarza, powiadomienie dzień przed i końce linii CRLF', () => {
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('TRIGGER:-P1D')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;UNTIL=')
    expect(ics.includes('\r\n')).toBe(true)
  })

  it('daje się wczytać z powrotem z tymi samymi godzinami i datami', () => {
    const back = parseIcs(ics)
    expect(back.error).toBeNull()
    expect(back.events).toHaveLength(3)

    const algebra = back.events.find((event) => event.title === 'Algebra, wykład')
    expect([algebra.event_date, algebra.start_time, algebra.end_time]).toEqual([
      '2026-10-05',
      '09:45',
      '11:15',
    ])

    const gym = back.events.find((event) => event.title === 'Siłownia; trening')
    expect([gym.valid_from, gym.valid_until, gym.day_of_week]).toEqual([
      '2026-10-06',
      '2026-12-15',
      2,
    ])

    const exam = back.events.find((event) => event.title === 'Egzamin: Algebra')
    expect([exam.event_date, exam.start_time]).toEqual(['2027-01-20', '09:00'])
  })
})

describe('eksport JSON', () => {
  it('zbiera dane konta, plan, sprawdziany i ustawienia', () => {
    const data = buildJsonExport({
      email: 'a@b.pl',
      profile: { display_name: 'Ala', share_details: false },
      events: [{ id: 1 }],
      tests: [],
      settings: { theme: 'dark' },
    })
    expect(data.account.displayName).toBe('Ala')
    expect(data.account.shareDetailsWithGroups).toBe(false)
    expect(data.schedule).toHaveLength(1)
    expect(data.settings.theme).toBe('dark')
  })
})