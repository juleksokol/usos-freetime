import { addDays, daysBetween, formatDate, todayISO, weekdayOf } from './dateUtils'
import { timeToMinutes } from './timeUtils'

// Rodzaje sprawdzianów: kolory są stałe (egzamin czerwony, kolokwium pomarańczowe, reszta zielona)
export const TEST_KINDS = {
  exam: { id: 'exam', label: 'Egzamin', plural: 'Egzaminy', color: '#ef4444', rank: 3 },
  colloquium: {
    id: 'colloquium',
    label: 'Kolokwium',
    plural: 'Kolokwia',
    color: '#f97316',
    rank: 2,
  },
  quiz: {
    id: 'quiz',
    label: 'Kartkówka / inne',
    plural: 'Kartkówki i inne',
    color: '#22c55e',
    rank: 1,
  },
}

export const TEST_KIND_ORDER = ['exam', 'colloquium', 'quiz']

const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']

const pad = (n) => String(n).padStart(2, '0')

// Data lokalna z obiektu Date jako "RRRR-MM-DD"
export function isoFromDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function testKind(test) {
  return TEST_KINDS[test.kind] ?? TEST_KINDS.quiz
}

export function testDisplayName(test) {
  return test.title?.trim() || testKind(test).label
}

export function shortMonth(iso) {
  return MONTHS[Number(iso.split('-')[1]) - 1]
}

export function countdownLabel(days) {
  if (days < 0) return 'minęło'
  if (days === 0) return 'dziś'
  if (days === 1) return 'jutro'
  return `za ${days} dni`
}

export function daysUntil(isoDate) {
  return daysBetween(todayISO(), isoDate)
}

export function sortTests(a, b) {
  return (
    a.test_date.localeCompare(b.test_date) ||
    a.start_time.localeCompare(b.start_time)
  )
}

// Pusty szkic do formularza
export function blankTest() {
  return {
    kind: 'colloquium',
    subject: '',
    title: '',
    date: todayISO(),
    start: '09:00',
    end: '10:30',
    location: '',
    notes: '',
    result: '',
    reminder: true,
  }
}

// Szkic z kafelka zajęć (przedmiot, data i godziny z zajęć)
export function draftFromTile(event, date) {
  return {
    ...blankTest(),
    subject: event.title,
    date,
    start: event.start_time.slice(0, 5),
    end: event.end_time.slice(0, 5),
    location: event.location ?? '',
  }
}

// Szkic z zapisanego sprawdzianu (edycja)
export function testToDraft(test) {
  return {
    id: test.id,
    kind: test.kind,
    subject: test.subject,
    title: test.title ?? '',
    date: test.test_date,
    start: test.start_time.slice(0, 5),
    end: test.end_time.slice(0, 5),
    location: test.location ?? '',
    notes: test.notes ?? '',
    result: test.result ?? '',
    reminder: test.reminder,
  }
}

// Sprawdzian jako "zajęcia" do narysowania na siatce planu
export function testToEvent(test) {
  const kind = testKind(test)

  return {
    id: `test-${test.id}`,
    testId: test.id,
    source: 'test',
    title: `${testDisplayName(test)}: ${test.subject}`,
    event_date: test.test_date,
    valid_from: null,
    valid_until: null,
    day_of_week: weekdayOf(test.test_date),
    start_time: test.start_time,
    end_time: test.end_time,
    location: test.location,
    teacher: null,
    event_type: kind.label,
    notes: test.notes,
    result: test.result,
    tileColor: kind.color,
  }
}

// Znaczniki (kropki) na zajęciach z przedmiotów, z których w danym tygodniu jest sprawdzian.
// Zwraca { [przedmiot]: { color, label } } (najważniejszy rodzaj: egzamin > kolokwium > reszta)
export function weekMarkers(tests, weekStart) {
  const weekEnd = addDays(weekStart, 6)
  const markers = {}

  for (const test of tests) {
    if (test.test_date < weekStart || test.test_date > weekEnd) continue

    const kind = testKind(test)
    const current = markers[test.subject]
    if (!current || kind.rank > current.rank) {
      markers[test.subject] = {
        rank: kind.rank,
        color: kind.color,
        label: `${kind.label} ${formatDate(test.test_date)}`,
      }
    }
  }

  return markers
}

/**
 * Przypomnienia, które powinny teraz zostać pokazane:
 *  - "jutro": dzień przed sprawdzianem od godziny reminderHour,
 *  - "dziś": w dniu sprawdzianu, dopóki się nie zaczął.
 */
export function getDueReminders(tests, now, reminderHour) {
  const today = isoFromDate(now)
  const tomorrow = addDays(today, 1)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const due = []

  for (const test of tests) {
    if (!test.reminder) continue

    if (test.test_date === tomorrow && nowMin >= reminderHour * 60) {
      due.push({ key: `${test.id}:${test.test_date}:tomorrow`, test, when: 'tomorrow' })
    } else if (test.test_date === today && nowMin < timeToMinutes(test.start_time)) {
      due.push({ key: `${test.id}:${test.test_date}:today`, test, when: 'today' })
    }
  }

  return due
}