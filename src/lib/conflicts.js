import { addDays, occursOn, todayISO, weekdayOf } from './dateUtils'

const MAX_WEEKS = 60

// Daty, w których wydarzenie się odbędzie (dla cyklicznych: do 60 tygodni od startu)
export function candidateDates(fields) {
  if (fields.event_date) return [fields.event_date]

  const from = fields.valid_from ?? todayISO()
  const until = fields.valid_until ?? addDays(from, MAX_WEEKS * 7)
  const offset = (fields.day_of_week - weekdayOf(from) + 7) % 7

  const dates = []
  for (
    let date = addDays(from, offset);
    date <= until && dates.length < 200;
    date = addDays(date, 7)
  ) {
    dates.push(date)
  }
  return dates
}

// Kolizje nowego wydarzenia z istniejącymi: [{ date, event }]
export function findConflicts(fields, existingEvents, ignoreId = null) {
  const start = fields.start_time.slice(0, 5)
  const end = fields.end_time.slice(0, 5)
  const conflicts = []

  for (const date of candidateDates(fields)) {
    const day = weekdayOf(date)

    for (const other of existingEvents) {
      if (other.id === ignoreId) continue
      if (other.day_of_week !== day || !occursOn(other, date)) continue

      const otherStart = other.start_time.slice(0, 5)
      const otherEnd = other.end_time.slice(0, 5)
      if (start < otherEnd && end > otherStart) conflicts.push({ date, event: other })
    }
  }

  return conflicts
}

// Łączy kolizje z tymi samymi zajęciami (ta sama nazwa, dzień i godziny) w jedną pozycję
export function groupConflicts(conflicts) {
  const groups = new Map()

  for (const { date, event } of conflicts) {
    const key = [
      event.title,
      event.day_of_week,
      event.start_time.slice(0, 5),
      event.end_time.slice(0, 5),
    ].join('|')

    if (!groups.has(key)) groups.set(key, { event, dates: [] })
    groups.get(key).dates.push(date)
  }

  return Array.from(groups.values())
}