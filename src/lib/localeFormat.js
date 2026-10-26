// Daty, nazwy dni i odliczanie zależne od języka interfejsu (przez Intl).
// locale: kod języka, np. 'pl-PL' albo 'en-GB'; iso: data w formacie RRRR-MM-DD.

const DAY_MS = 86400000

const toUtc = (iso) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const capitalize = (text) => text.charAt(0).toLocaleUpperCase() + text.slice(1)

// Dzień tygodnia 1-7 (poniedziałek = 1) dla podanej daty
export function weekdayNumber(iso) {
  return ((toUtc(iso).getUTCDay() + 6) % 7) + 1
}

// Nazwa dnia tygodnia (1 = poniedziałek ... 7 = niedziela); style: 'long' | 'short'
export function dayName(day, locale, style = 'long') {
  const date = new Date(Date.UTC(2024, 0, day)) // 1.01.2024 to poniedziałek
  return capitalize(new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(date))
}

export function formatDate(iso, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toUtc(iso))
}

export function formatDayMonth(iso, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(toUtc(iso))
}

// np. „Wtorek 20.10.2026” albo „Tuesday 20/10/2026”
export function formatLongDate(iso, locale) {
  return `${dayName(weekdayNumber(iso), locale)} ${formatDate(iso, locale)}`
}

// Tydzień roboczy zaczynający się w podanym poniedziałku: „19.10.2026 – 23.10.2026”
export function formatWeekRange(mondayISO, locale) {
  const friday = new Date(toUtc(mondayISO).getTime() + 4 * DAY_MS).toISOString().slice(0, 10)
  return `${formatDate(mondayISO, locale)} – ${formatDate(friday, locale)}`
}

export function shortMonth(iso, locale) {
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(toUtc(iso))
}

// „dziś”, „jutro”, „za 5 dni” (z poprawną liczbą mnogą) albo „minęło”; t: tłumacz z useI18n()
export function formatCountdown(days, t) {
  if (days < 0) return t('countdown.past')
  if (days === 0) return t('countdown.today')
  if (days === 1) return t('countdown.tomorrow')
  return t('countdown.inDays', { count: days })
}

const TEST_KIND_KEYS = {
  exam: 'testKind.exam',
  colloquium: 'testKind.colloquium',
  quiz: 'testKind.quiz',
}

// Nazwa rodzaju sprawdzianu (egzamin, kolokwium, kartkówka / inne) w języku interfejsu
export function testKindLabel(test, t) {
  return t(TEST_KIND_KEYS[test.kind] ?? TEST_KIND_KEYS.quiz)
}

// Własny tytuł sprawdzianu albo nazwa jego rodzaju
export function testDisplayName(test, t) {
  return test.title?.trim() || testKindLabel(test, t)
}
