const pad = (n) => String(n).padStart(2, '0')

// Wszystkie daty to teksty "RRRR-MM-DD"; obliczenia w UTC, żeby uniknąć problemów ze zmianą czasu

export function parseISO(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function toISO(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`
}

export function addDays(iso, days) {
  const date = parseISO(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return toISO(date)
}

export function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Poniedziałek tygodnia, w którym leży dana data
export function mondayOf(iso) {
  const dayOfWeek = parseISO(iso).getUTCDay() || 7 // niedziela = 7
  return addDays(iso, 1 - dayOfWeek)
}

// Domyślny tydzień: bieżący; w weekend następny
export function defaultWeekStart() {
  const today = todayISO()
  const dayOfWeek = parseISO(today).getUTCDay() // 0 = niedziela, 6 = sobota
  const monday = mondayOf(today)
  return dayOfWeek === 0 || dayOfWeek === 6 ? addDays(monday, 7) : monday
}

// "2026-10-05" -> "05.10"
export function formatDayMonth(iso) {
  const [, month, day] = iso.split('-')
  return `${day}.${month}`
}

// "2026-10-05" -> "05.10.2026"
export function formatDate(iso) {
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

// "05.10.2026 – 09.10.2026"
export function formatWeekRange(mondayISO) {
  return `${formatDate(mondayISO)} – ${formatDate(addDays(mondayISO, 4))}`
}

// Czy zajęcia odbywają się w danym dniu (data "RRRR-MM-DD")?
//  - zajęcia z konkretną datą: tylko tego dnia,
//  - zajęcia cykliczne (valid_from / valid_until): co tydzień w swój dzień, w zakresie dat,
//  - zajęcia bez żadnych dat (szablon tygodniowy): w każdym tygodniu.
export function occursOn(event, isoDate) {
  if (event.event_date) return event.event_date === isoDate
  if (event.valid_from && isoDate < event.valid_from) return false
  if (event.valid_until && isoDate > event.valid_until) return false
  return true
}

// Zajęcia widoczne w tygodniu zaczynającym się w podanym poniedziałku
export function eventsForWeek(events, weekStart) {
  return events.filter((event) =>
    occursOn(event, addDays(weekStart, event.day_of_week - 1))
  )
}