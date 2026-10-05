import Papa from 'papaparse'
import { addDays } from './dateUtils'

// Aliasy nazw kolumn (po normalizacji: małe litery, bez polskich znaków).
// Kolejność pól ma znaczenie: pola "pierwszy/ostatni dzień" zajmują swoje kolumny
// przed polem "dzień", żeby dopasowanie częściowe ich nie przechwyciło.
const FIELD_ALIASES = {
  firstDay: ['pierwszy dzien', 'first day'],
  lastDay: ['ostatni dzien', 'last day'],
  day: ['dzien tygodnia', 'dzien zajec', 'dzien', 'day'],
  date: ['data', 'data zajec', 'date'],
  start: [
    'godzina rozpoczecia',
    'godz rozpoczecia',
    'ogloszony poczatek',
    'godzina od',
    'godz od',
    'czas rozpoczecia',
    'poczatek',
    'start',
    'od',
  ],
  end: [
    'godzina zakonczenia',
    'godz zakonczenia',
    'ogloszony koniec',
    'godzina do',
    'godz do',
    'czas zakonczenia',
    'koniec',
    'end',
    'do',
  ],
  time: ['godziny', 'godziny zajec', 'godzina', 'godz', 'czas', 'time'],
  title: [
    'nazwa przedmiotu',
    'przedmiot',
    'nazwa zajec',
    'tytul',
    'nazwa',
    'zajecia',
    'subject',
    'title',
  ],
  type: [
    'rodzaj zajec',
    'typ zajec',
    'forma zajec',
    'rodzaj',
    'typ',
    'forma',
    'type',
  ],
  building: ['budynek', 'building'],
  room: [
    'nr sali',
    'numer sali',
    'sala zajec',
    'sala',
    'miejsce',
    'lokalizacja',
    'room',
    'location',
  ],
  teacher: [
    'prowadzacy',
    'prowadzacy zajecia',
    'wykladowca',
    'nauczyciel',
    'teacher',
  ],
}

const WEEKDAY_PREFIXES = [
  ['pon', 1],
  ['pn', 1],
  ['wt', 2],
  ['sr', 3],
  ['czw', 4],
  ['cz', 4],
  ['pia', 5],
  ['pt', 5],
  ['sob', 6],
  ['sb', 6],
  ['nie', 7],
  ['nd', 7],
]

// Skróty dni sklejane w jednym polu, np. "ŚrCz" (po normalizacji: "srcz")
const DAY_CODES = { pn: 1, wt: 2, sr: 3, cz: 4, pt: 5, so: 6, nd: 7 }

// Maksymalna liczba dni sprawdzanych przy rozwijaniu jednej serii zajęć
const MAX_SERIES_DAYS = 400

// Skróty rodzajów zajęć używane w planach
const TYPE_LABELS = {
  WYK: 'Wykład',
  CW: 'Ćwiczenia',
  CWA: 'Ćwiczenia audytoryjne',
  CWL: 'Ćwiczenia laboratoryjne',
  CWP: 'Ćwiczenia projektowe',
  LAB: 'Laboratorium',
  SEM: 'Seminarium',
  KON: 'Konwersatorium',
  PRO: 'Projekt',
  LEK: 'Lektorat',
}

function normalizeType(value) {
  const key = String(value ?? '').trim().toUpperCase()
  return TYPE_LABELS[key] ?? String(value ?? '').trim()
}

// Małe litery, bez polskich znaków diakrytycznych, bez znaków specjalnych
function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Zwraca mapę: pole -> indeks kolumny
function mapColumns(cells) {
  const normalized = cells.map(normalize)
  const used = new Set()
  const map = {}

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    let index = -1

    for (const alias of aliases) {
      index = normalized.findIndex((h, i) => !used.has(i) && h === alias)
      if (index !== -1) break
    }

    if (index === -1) {
      for (const alias of aliases) {
        if (alias.length < 5) continue
        index = normalized.findIndex((h, i) => !used.has(i) && h.includes(alias))
        if (index !== -1) break
      }
    }

    if (index !== -1) {
      map[field] = index
      used.add(index)
    }
  }

  return map
}

function isValidMapping(map) {
  const has = (key) => map[key] !== undefined
  const hasTitle = has('title')
  const hasTime = (has('start') && has('end')) || has('time')
  const hasDay =
    has('day') || has('date') || has('firstDay') || (has('start') && has('end'))
  return hasTitle && hasTime && hasDay
}

function parseWeekday(value) {
  const token = normalize(value).split(' ')[0]
  if (!token) return null
  if (/^[1-7]$/.test(token)) return Number(token)
  for (const [prefix, day] of WEEKDAY_PREFIXES) {
    if (token.startsWith(prefix)) return day
  }
  return null
}

// Zbiór dni tygodnia z pola typu "Pt", "Wtorek" albo "ŚrCz" (kilka dni sklejonych)
function parseWeekdaySet(value) {
  const compact = normalize(value).replace(/ /g, '')
  const days = new Set()

  for (const match of compact.matchAll(/pn|wt|sr|cz|pt|so|nd/g)) {
    days.add(DAY_CODES[match[0]])
  }

  if (days.size === 0) {
    const single = parseWeekday(value)
    if (single) days.add(single)
  }

  return days
}

// Obsługuje RRRR-MM-DD oraz D.M.RRRR / DD.MM.RRRR (też z / i -). Zwraca "RRRR-MM-DD" lub null
function parseDateISO(value) {
  const text = String(value ?? '')
  let year
  let month
  let day

  let match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    year = Number(match[1])
    month = Number(match[2])
    day = Number(match[3])
  } else {
    match = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/)
    if (!match) return null
    day = Number(match[1])
    month = Number(match[2])
    year = Number(match[3])
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  return date.toISOString().slice(0, 10)
}

// "RRRR-MM-DD" -> 1 (poniedziałek) ... 7 (niedziela)
function weekdayFromISO(iso) {
  const jsDay = new Date(`${iso}T00:00:00Z`).getUTCDay() // 0 = niedziela
  return jsDay === 0 ? 7 : jsDay
}

/**
 * Daty zajęć z wiersza typu UniTime ("pierwszy dzień" / "ostatni dzień" / "dzień tygodnia"):
 *  - brak ostatniego dnia (albo taki sam jak pierwszy) = JEDNO spotkanie w pierwszym dniu,
 *  - jest ostatni dzień = spotkania w dniach tygodnia z pola "dzień tygodnia" od pierwszego
 *    do ostatniego dnia włącznie (pierwszy i ostatni dzień są zawsze spotkaniami).
 */
function seriesDates(first, last, weekdays) {
  if (!last || last <= first) return [first]

  const days = weekdays.size > 0 ? weekdays : new Set([weekdayFromISO(first)])
  const dates = []

  for (
    let date = first, i = 0;
    date <= last && i < MAX_SERIES_DAYS;
    date = addDays(date, 1), i++
  ) {
    if (date === first || date === last || days.has(weekdayFromISO(date))) {
      dates.push(date)
    }
  }

  return dates
}

function formatTime(hours, minutes) {
  const h = Number(hours)
  const m = Number(minutes)
  if (h > 23 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Wyciąga wszystkie godziny w formacie H:MM lub HH:MM
function extractTimes(value) {
  return Array.from(String(value ?? '').matchAll(/(\d{1,2}):(\d{2})/g), (m) =>
    formatTime(m[1], m[2])
  ).filter(Boolean)
}

function fail(message) {
  return { events: [], warnings: [], error: message }
}

export function parseUsosCsv(rawText) {
  const text = String(rawText ?? '').replace(/^\uFEFF/, '')

  const parsed = Papa.parse(text, {
    skipEmptyLines: 'greedy',
    delimitersToGuess: [';', ',', '\t', '|'],
  })
  const rows = parsed.data

  if (!rows.length) return fail('Plik jest pusty.')

  // Szukamy wiersza nagłówka w pierwszych 20 wierszach
  let headerIndex = -1
  let columns = null

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const candidate = mapColumns(rows[i])
    if (isValidMapping(candidate)) {
      headerIndex = i
      columns = candidate
      break
    }
  }

  if (!columns) {
    const preview = rows[0].slice(0, 8).join(' | ')
    return fail(
      `Nie rozpoznano kolumn w pliku. Pierwszy wiersz: "${preview}". ` +
        'Potrzebne są co najmniej: datę (lub dzień), godziny oraz nazwę przedmiotu.'
    )
  }

  const warnings = []
  const unique = new Map()
  let dataRows = 0

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    const lineNumber = i + 1
    const cell = (field) =>
      columns[field] !== undefined ? String(row[columns[field]] ?? '').trim() : ''

    dataRows++

    const title = cell('title')
    if (!title) {
      warnings.push(`Wiersz ${lineNumber}: brak nazwy zajęć, pominięto.`)
      continue
    }

    // Daty tego wiersza. Jeden wiersz może opisywać serię spotkań.
    //  1) konkretna data zajęć (kolumna daty albo data ukryta w kolumnie startu),
    //  2) seria "pierwszy dzień" - "ostatni dzień" (format UniTime),
    //  3) tylko dzień tygodnia: szablon cotygodniowy bez dat (jedna pozycja z event_date = null).
    let dates = []

    let eventDate = null
    if (cell('date')) eventDate = parseDateISO(cell('date'))
    if (!eventDate && cell('start')) eventDate = parseDateISO(cell('start'))

    if (eventDate) {
      dates = [eventDate]
    } else if (columns.firstDay !== undefined) {
      const first = parseDateISO(cell('firstDay'))
      if (first) {
        dates = seriesDates(
          first,
          parseDateISO(cell('lastDay')),
          parseWeekdaySet(cell('day'))
        )
      }
    } else {
      dates = [null]
    }

    // Dzień tygodnia dla szablonu bez dat
    const templateDay = parseWeekday(cell('day'))

    if (dates.length === 0 || (dates[0] === null && !templateDay)) {
      warnings.push(`Wiersz ${lineNumber} („${title}"): nie rozpoznano dnia ani daty.`)
      continue
    }

    // Godziny: osobne kolumny albo jeden zakres, np. 08:00-09:30
    let start = null
    let end = null

    if (columns.start !== undefined && columns.end !== undefined) {
      start = extractTimes(cell('start'))[0] ?? null
      end = extractTimes(cell('end'))[0] ?? null
    }

    if ((!start || !end) && columns.time !== undefined) {
      const times = extractTimes(cell('time'))
      if (times.length >= 2) {
        start = times[0]
        end = times[1]
      }
    }

    if (!start || !end) {
      warnings.push(`Wiersz ${lineNumber} („${title}"): nie rozpoznano godzin.`)
      continue
    }

    if (end <= start) {
      warnings.push(
        `Wiersz ${lineNumber} („${title}"): godzina zakończenia nie jest późniejsza niż rozpoczęcia.`
      )
      continue
    }

    // Lokalizacja: budynek + sala (np. "C3 501"); sala wirtualna bez budynku
    const building = cell('building')
    const room = cell('room')
    const location =
      room.toLowerCase() === 'wirtualna'
        ? 'Wirtualna'
        : [building, room].filter(Boolean).join(' ') || null

    for (const date of dates) {
      const day = date ? weekdayFromISO(date) : templateDay

      const event = {
        title,
        event_date: date,
        valid_from: null,
        valid_until: null,
        day_of_week: day,
        start_time: start,
        end_time: end,
        location,
        teacher: cell('teacher') || null,
        event_type: normalizeType(cell('type')) || null,
      }

      // Usuwanie dokładnych duplikatów (np. ten sam termin w dwóch wierszach)
      const key = [date ?? '', day, start, end, title, location ?? ''].join('|')
      if (!unique.has(key)) unique.set(key, event)
    }
  }

  const sortDate = (event) => event.event_date ?? ''

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
      error: 'Nie znaleziono żadnych poprawnych zajęć w pliku.',
    }
  }

  return { events, warnings, error: null, totalRows: dataRows }
}

// Czyta plik jako tekst: najpierw UTF-8, a gdy się nie uda, Windows-1250 (Excel)
export async function readFileAsText(file) {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1250').decode(buffer)
  }
}