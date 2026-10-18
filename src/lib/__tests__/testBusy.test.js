import { describe, expect, it } from 'vitest'
import { eventsForWeek, eventsOnDate } from '../dateUtils'
import { findCommonFreeSlots } from '../freeSlots'
import { testToEvent } from '../tests'

// 21.10.2026 to środa (dzień 3), tydzień zaczyna się w poniedziałek 19.10.2026
const test = {
  id: 't1',
  kind: 'colloquium',
  subject: 'Algebra',
  title: null,
  test_date: '2026-10-21',
  start_time: '10:30:00',
  end_time: '11:30:00',
  location: null,
  notes: null,
  result: null,
  reminder: true,
}

const friendClass = {
  id: 'f1',
  title: 'Fizyka',
  event_date: '2026-10-21',
  day_of_week: 3,
  start_time: '08:00:00',
  end_time: '10:00:00',
  source: 'import',
}

const options = { dayStartMin: 8 * 60, dayEndMin: 20 * 60, minDuration: 45, days: [3] }

describe('sprawdziany jako zajęty czas we wspólnych okienkach', () => {
  it('bez sprawdzianu okienko trwa do końca dnia', () => {
    expect(findCommonFreeSlots([friendClass], options)).toEqual([
      { day: 3, startMin: 600, endMin: 1200 },
    ])
  })

  it('sprawdzian dzieli okienko i odcina zbyt krótkie kawałki', () => {
    const busy = eventsForWeek([testToEvent(test)], '2026-10-19')
    expect(busy).toHaveLength(1)

    // 10:00-10:30 jest krótsze niż 45 min, zostaje tylko 11:30-20:00
    expect(findCommonFreeSlots([friendClass, ...busy], options)).toEqual([
      { day: 3, startMin: 690, endMin: 1200 },
    ])
  })

  it('sprawdzian z innego tygodnia ani dnia nie jest liczony', () => {
    expect(eventsForWeek([testToEvent(test)], '2026-10-26')).toHaveLength(0)
    expect(eventsOnDate([testToEvent(test)], '2026-10-20')).toHaveLength(0)
    expect(eventsOnDate([testToEvent(test)], '2026-10-21')).toHaveLength(1)
  })
})