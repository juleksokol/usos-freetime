import { addDays, mondayOf, todayISO, weekdayOf } from './dateUtils'
import { testDisplayName, testKind } from './tests'

const CRLF = '\r\n'

const WARSAW_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// Data i godzina w czasie polskim -> milisekundy UTC (z uwzględnieniem czasu letniego)
export function warsawToUtcMs(date, time) {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number)
  const wanted = Date.UTC(year, month - 1, day, hours, minutes)

  let guess = wanted
  for (let i = 0; i < 2; i++) {
    const parts = Object.fromEntries(
      WARSAW_FORMAT.formatToParts(new Date(guess)).map((part) => [part.type, part.value])
    )
    const shown = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour,
      +parts.minute
    )
    guess += wanted - shown
  }

  return guess
}

// 1791195900000 -> "20261005T074500Z"
function formatUtc(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// Linie iCal mają maksymalnie 75 bajtów; dłuższe zawijamy (kolejna linia zaczyna się spacją)
function fold(line) {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line

  const parts = []
  let current = ''
  let bytes = 0

  for (const char of line) {
    const size = encoder.encode(char).length
    const limit = parts.length === 0 ? 75 : 74
    if (bytes + size > limit) {
      parts.push(current)
      current = char
      bytes = size
    } else {
      current += char
      bytes += size
    }
  }
  parts.push(current)

  return parts.join(`${CRLF} `)
}

function classLines(event, stamp) {
  const lines = ['BEGIN:VEVENT', `UID:${event.id}@usos-freetime`, `DTSTAMP:${stamp}`]

  if (event.event_date) {
    lines.push(
      `DTSTART:${formatUtc(warsawToUtcMs(event.event_date, event.start_time))}`,
      `DTEND:${formatUtc(warsawToUtcMs(event.event_date, event.end_time))}`
    )
  } else {
    // Zajęcia cykliczne: pierwszy termin w swoim dniu tygodnia + reguła co tydzień
    const first = event.valid_from
      ? addDays(
          event.valid_from,
          (event.day_of_week - weekdayOf(event.valid_from) + 7) % 7
        )
      : addDays(mondayOf(todayISO()), event.day_of_week - 1)

    lines.push(
      `DTSTART:${formatUtc(warsawToUtcMs(first, event.start_time))}`,
      `DTEND:${formatUtc(warsawToUtcMs(first, event.end_time))}`
    )

    const until = event.valid_until
      ? `;UNTIL=${formatUtc(warsawToUtcMs(event.valid_until, '23:59'))}`
      : ''
    lines.push(`RRULE:FREQ=WEEKLY${until}`)
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`)
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)

  const description = [event.event_type, event.teacher].filter(Boolean).join(' · ')
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`)

  lines.push('END:VEVENT')
  return lines
}

function testLines(test, stamp) {
  const kind = testKind(test)
  const title = `${testDisplayName(test)}: ${test.subject}`

  const lines = [
    'BEGIN:VEVENT',
    `UID:test-${test.id}@usos-freetime`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatUtc(warsawToUtcMs(test.test_date, test.start_time))}`,
    `DTEND:${formatUtc(warsawToUtcMs(test.test_date, test.end_time))}`,
    `SUMMARY:${escapeText(title)}`,
    `CATEGORIES:${escapeText(kind.label)}`,
  ]

  if (test.location) lines.push(`LOCATION:${escapeText(test.location)}`)

  const description = [test.notes, test.result ? `Wynik: ${test.result}` : null]
    .filter(Boolean)
    .join('\n')
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`)

  // Powiadomienie w aplikacji kalendarza dzień przed
  if (test.reminder) {
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(`Jutro: ${title}`)}`,
      'END:VALARM'
    )
  }

  lines.push('END:VEVENT')
  return lines
}

// Kalendarz .ics z zajęciami, własnymi wydarzeniami i sprawdzianami
export function buildIcs(events, tests = [], now = new Date()) {
  const stamp = formatUtc(now.getTime())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//USOS FreeTime//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:USOS FreeTime',
    'X-WR-TIMEZONE:Europe/Warsaw',
    ...events.flatMap((event) => classLines(event, stamp)),
    ...tests.flatMap((test) => testLines(test, stamp)),
    'END:VCALENDAR',
  ]

  return lines.map(fold).join(CRLF) + CRLF
}

// Wszystkie dane użytkownika w jednym obiekcie (do pliku JSON)
export function buildJsonExport({ email, profile, events, tests, settings }) {
  return {
    app: 'USOS FreeTime',
    exportedAt: new Date().toISOString(),
    account: {
      email: email ?? null,
      displayName: profile?.display_name ?? null,
      shareDetailsWithGroups: profile?.share_details ?? true,
    },
    schedule: events,
    tests,
    settings,
  }
}

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}