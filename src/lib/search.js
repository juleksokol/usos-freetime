import { addDays, occursOn, weekdayOf } from './dateUtils'
import { normalizeText } from './text'

const LOOKAHEAD_DAYS = 28
const MAX_OCCURRENCES = 20
const MAX_SUBJECTS = 20

// Najbliższa data zajęć od dnia `today` (zajęć cyklicznych szukamy do 4 tygodni naprzód)
export function nextOccurrence(event, today) {
  if (event.event_date) return event.event_date >= today ? event.event_date : null

  for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
    const date = addDays(today, i)
    if (weekdayOf(date) === event.day_of_week && occursOn(event, date)) return date
  }
  return null
}

/**
 * Wyszukiwanie po przedmiocie, prowadzącym, sali i rodzaju zajęć
 * (bez rozróżniania wielkości liter i polskich znaków; wszystkie wpisane słowa muszą pasować).
 * Zwraca null dla pustego zapytania albo { subjects, occurrences, tests }.
 */
export function searchPlan(events, tests, query, today) {
  const tokens = normalizeText(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return null

  const matches = (...parts) => {
    const haystack = normalizeText(parts.filter(Boolean).join(' '))
    return tokens.every((token) => haystack.includes(token))
  }

  const found = events.filter((event) =>
    matches(event.title, event.teacher, event.location, event.event_type)
  )

  // Przedmioty (zajęcia z planu) zgrupowane po nazwie
  const bySubject = new Map()
  for (const event of found) {
    if (event.source === 'custom') continue

    if (!bySubject.has(event.title)) {
      bySubject.set(event.title, {
        subject: event.title,
        teachers: new Set(),
        types: new Set(),
        count: 0,
        next: null,
      })
    }

    const group = bySubject.get(event.title)
    if (event.teacher) group.teachers.add(event.teacher)
    if (event.event_type) group.types.add(event.event_type)
    group.count++

    const date = nextOccurrence(event, today)
    if (
      date &&
      (!group.next ||
        date < group.next.date ||
        (date === group.next.date && event.start_time < group.next.event.start_time))
    ) {
      group.next = { date, event }
    }
  }

  const subjects = Array.from(bySubject.values())
    .map((group) => ({
      ...group,
      teachers: [...group.teachers],
      types: [...group.types],
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'pl'))
    .slice(0, MAX_SUBJECTS)

  // Najbliższe terminy (zajęcia i własne wydarzenia)
  const occurrences = found
    .map((event) => ({ event, date: nextOccurrence(event, today) }))
    .filter((item) => item.date)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.event.start_time.localeCompare(b.event.start_time)
    )
    .slice(0, MAX_OCCURRENCES)

  const matchedTests = tests
    .filter((test) => matches(test.subject, test.title, test.notes, test.location))
    .sort((a, b) => a.test_date.localeCompare(b.test_date))

  return { subjects, occurrences, tests: matchedTests }
}