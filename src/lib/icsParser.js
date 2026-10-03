import { addDays, mondayOf, weekdayOf } from './dateUtils'
import { minutesToTime, timeToMinutes } from './timeUtils'

// Godziny zapisane w UTC (z literą Z) przeliczamy na czas polski
const WARSAW_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const BYDAY_CODES = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 }
const MAX_DAYS_WITHOUT_END = 400

function fail(message) {
  return { events: [], warnings: [], error: message }
}

function unescapeText(value) {
  return String(value ?? '')
    .replace(/\\n/gi, ' ')
    .replace(/\\([,;\\])/g, '$1')
    .trim()
}

// "DTSTART;TZID=Europe/Warsaw:20261001T094500" -> { name, params, value }
function parseContentLine(line) {
  let inQuotes = false
  let colon = -1

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') inQuotes = !inQuotes
    else if (char === ':' && !inQuotes) {
      colon = i
      break
    }
  }
  if (colon === -1) return null

  const [rawName, ...rawParams] = line.slice(0, colon).split(';')
  const params = {}
  for (const param of rawParams) {
    const eq = param.indexOf('=')
    if (eq > 0) {
      params[param.slice(0, eq).toUpperCase()] = param
        .slice(eq + 1)
        .replace(/^"|"$/g, '')
    }
  }

  return { name: rawName.trim().toUpperCase(), params, value: line.slice(colon + 1) }
}

// Zwraca { date: "RRRR-MM-DD", time: "HH:MM" | null } w czasie lokalnym (Polska)
function parseDateValue(prop) {
  if (!prop) return null

  const match = String(prop.value)
    .trim()
    .match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/)
  if (!match) return null

  const [, year, month, day, hours, minutes, , zulu] = match

  if (hours === undefined) return { date: `${year}-${month}-${day}`, time: null }

  const tzid = String(prop.params?.TZID ?? '').toUpperCase()
  const isUtc = Boolean(zulu) || ['UTC', 'ETC/UTC', 'GMT'].includes(tzid)

  if (!isUtc) return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }

  const parts = Object.fromEntries(
    WARSAW_FORMAT.formatToParts(
      new Date(Date.UTC(+year, +month - 1, +day, +hours, +minutes))
    ).map((part) => [part.type, part.value])
  )

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

// "PT1H30M" -> 90 (minuty)
function parseDuration(value) {
  const match = String(value)
    .trim()
    .match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/)
  if (!match) return null
  const [, weeks, days, hours, minutes] = match
  return (
    Number(weeks ?? 0) * 7 * 1440 +
    Number(days ?? 0) * 1440 +
    Number(hours ?? 0) * 60 +
    Number(minutes ?? 0)
  )
}

function parseRRule(value) {
  const parts = {}
  for (const piece of String(value).split(';')) {
    const [key, val] = piece.split('=')
    if (key && val !== undefined) parts[key.toUpperCase()] = val
  }

  return {
    freq: String(parts.FREQ ?? '').toUpperCase(),
    interval: Math.max(1, Number(parts.INTERVAL) || 1),
    count: parts.COUNT ? Number(parts.COUNT) || null : null,
    until: parts.UNTIL
      ? parseDateValue({ value: parts.UNTIL, params: {} })?.date ?? null
      : null,
    byday: String(parts.BYDAY ?? '')
      .split(',')
      .map((code) => BYDAY_CODES[code.trim().toUpperCase().slice(-2)])
      .filter(Boolean),
  }
}

function readEvent(props) {
  const get = (name) => props.find((prop) => prop.name === name)
  const all = (name) => props.filter((prop) => prop.name === name)

  return {
    uid: get('UID')?.value ?? '',
    summary: unescapeText(get('SUMMARY')?.value),
    location: unescapeText(get('LOCATION')?.value),
    status: String(get('STATUS')?.value ?? '').toUpperCase(),
    dtstart: parseDateValue(get('DTSTART')),
    dtend: parseDateValue(get('DTEND')),
    duration: get('DURATION') ? parseDuration(get('DURATION').value) : null,
    rrule: get('RRULE') ? parseRRule(get('RRULE').value) : null,
    exdates: all('EXDATE').flatMap((prop) =>
      prop.value
        .split(',')
        .map((value) => parseDateValue({ value, params: prop.params })?.date)
        .filter(Boolean)
    ),
    recurrenceId: get('RECURRENCE-ID')
      ? parseDateValue(get('RECURRENCE-ID'))?.date ?? null
      : null,
  }
}

// Godziny rozpoczęcia i zakończenia albo powód odrzucenia
function resolveTimes(event) {
  if (!event.dtstart || !event.dtstart.time) return { problem: 'allday' }

  const startMin = timeToMinutes(event.dtstart.time)
  let endMin

  if (event.dtend && event.dtend.time) {
    if (event.dtend.date === event.dtstart.date) {
      endMin = timeToMinutes(event.dtend.time)
    } else if (
      event.dtend.date === addDays(event.dtstart.date, 1) &&
      event.dtend.time === '00:00'
    ) {
      endMin = 23 * 60 + 59 // koniec o północy
    } else {
      return { problem: 'multiday' }
    }
  } else if (event.duration) {
    endMin = startMin + event.duration
    if (endMin > 24 * 60) return { problem: 'multiday' }
  } else {
    return { problem: 'noend' }
  }

  if (endMin <= startMin) return { problem: 'badtime' }

  return { start: minutesToTime(startMin), end: minutesToTime(endMin) }
}

// Daty kolejnych wystąpień reguły tygodniowej (z uwzględnieniem wyjątków)
function weeklyOccurrences(startDate, rule, excluded) {
  const days = rule.byday.length
    ? [...rule.byday].sort((a, b) => a - b)
    : [weekdayOf(startDate)]
  const hasEnd = Boolean(rule.until || rule.count)
  const cap = addDays(startDate, MAX_DAYS_WITHOUT_END)
  const anchor = mondayOf(startDate)

  const result = []
  let produced = 0

  for (let week = 0; week < 400; week++) {
    const monday = addDays(anchor, 7 * rule.interval * week)
    if (!hasEnd && monday > cap) return result

    for (const day of days) {
      const date = addDays(monday, day - 1)
      if (date < startDate) continue
      if (rule.until && date > rule.until) return result
      if (rule.count && produced >= rule.count) return result

      produced++
      if (!excluded.has(date)) result.push(date)
    }
  }

  return result
}

export function parseIcs(rawText) {
  const text = String(rawText ?? '').replace(/^\uFEFF/, '')

  // Rozwijanie zawiniętych linii (kolejna linia zaczyna się spacją lub tabulatorem)
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)

  const rawEvents = []
  let current = null
  let alarmDepth = 0

  for (const line of lines) {
    const upper = line.trim().toUpperCase()

    if (upper === 'BEGIN:VEVENT') {
      current = []
      alarmDepth = 0
      continue
    }
    if (upper === 'END:VEVENT') {
      if (current) rawEvents.push(current)
      current = null
      continue
    }
    if (!current) continue

    if (upper === 'BEGIN:VALARM') {
      alarmDepth++
      continue
    }
    if (upper === 'END:VALARM') {
      alarmDepth = Math.max(0, alarmDepth - 1)
      continue
    }
    if (alarmDepth > 0) continue

    const parsed = parseContentLine(line)
    if (parsed) current.push(parsed)
  }

  if (!rawEvents.length) {
    return fail('Nie znaleziono żadnych wydarzeń w pliku .ics.')
  }

  const items = rawEvents.map(readEvent)

  // Zmienione pojedyncze wystąpienia serii (RECURRENCE-ID) wyłączają oryginał z serii
  const overridden = new Map()
  for (const item of items) {
    if (item.recurrenceId) {
      if (!overridden.has(item.uid)) overridden.set(item.uid, new Set())
      overridden.get(item.uid).add(item.recurrenceId)
    }
  }

  const unique = new Map()
  const skipped = { cancelled: 0, allday: 0, multiday: 0, noend: 0, badtime: 0 }
  const warnings = []

  const add = (event) => {
    const key = [
      event.event_date ?? '',
      event.valid_from ?? '',
      event.valid_until ?? '',
      event.day_of_week,
      event.start_time,
      event.end_time,
      event.title,
      event.location ?? '',
    ].join('|')
    if (!unique.has(key)) unique.set(key, event)
  }

  for (const item of items) {
    if (item.status === 'CANCELLED') {
      skipped.cancelled++
      continue
    }

    const times = resolveTimes(item)
    if (times.problem) {
      skipped[times.problem]++
      continue
    }

    const startDate = item.dtstart.date
    const base = {
      title: item.summary || 'Bez nazwy',
      start_time: times.start,
      end_time: times.end,
      location: item.location || null,
      teacher: null,
      event_type: null,
    }

    const single = (date) =>
      add({
        ...base,
        event_date: date,
        valid_from: null,
        valid_until: null,
        day_of_week: weekdayOf(date),
      })

    if (!item.rrule || item.recurrenceId) {
      single(startDate)
      continue
    }

    if (item.rrule.freq !== 'WEEKLY') {
      warnings.push(
        `„${base.title}": powtarzanie typu ${item.rrule.freq || 'nieznanego'} nie jest obsługiwane, zaimportowano tylko pierwsze wystąpienie.`
      )
      single(startDate)
      continue
    }

    const rule = item.rrule
    const excluded = new Set([
      ...item.exdates,
      ...(overridden.get(item.uid) ?? []),
    ])
    const startDay = weekdayOf(startDate)
    const isSimple =
      rule.interval === 1 &&
      (rule.byday.length === 0 ||
        (rule.byday.length === 1 && rule.byday[0] === startDay)) &&
      excluded.size === 0

    if (isSimple) {
      // Zwykłe zajęcia co tydzień: zapisujemy jako jeden wpis cykliczny
      add({
        ...base,
        event_date: null,
        valid_from: startDate,
        valid_until:
          rule.until ??
          (rule.count ? addDays(startDate, 7 * (rule.count - 1)) : null),
        day_of_week: startDay,
      })
    } else {
      // Co drugi tydzień, kilka dni w tygodniu, wyjątki: rozwijamy na pojedyncze daty
      weeklyOccurrences(startDate, rule, excluded).forEach(single)
    }
  }

  if (skipped.cancelled) {
    warnings.push(`Pominięto odwołane wydarzenia: ${skipped.cancelled}.`)
  }
  if (skipped.allday) {
    warnings.push(`Pominięto wydarzenia całodniowe: ${skipped.allday}.`)
  }
  if (skipped.multiday) {
    warnings.push(
      `Pominięto wydarzenia trwające ponad dobę lub przez północ: ${skipped.multiday}.`
    )
  }
  if (skipped.noend || skipped.badtime) {
    warnings.push(
      `Pominięto wydarzenia bez poprawnej godziny zakończenia: ${skipped.noend + skipped.badtime}.`
    )
  }

  const sortDate = (event) => event.event_date ?? event.valid_from ?? ''

  const events = Array.from(unique.values()).sort(
    (a, b) =>
      sortDate(a).localeCompare(sortDate(b)) ||
      a.day_of_week - b.day_of_week ||
      a.start_time.localeCompare(b.start_time)
  )

  if (!events.length) {
    return {
      events: [],
      warnings,
      error: 'Nie znaleziono żadnych poprawnych zajęć w pliku .ics.',
    }
  }

  return { events, warnings, error: null, totalRows: rawEvents.length }
}