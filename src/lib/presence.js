import { findCommonFreeSlots } from './freeSlots'
import { timeToMinutes } from './timeUtils'

/**
 * Czy osoba ma teraz zajęcia?
 * events: zajęcia osoby z jednego dnia; nowMin: bieżąca godzina w minutach.
 * Zwraca { busy, until, title }:
 *  - zajęta: until = koniec ciągu zajęć (kolejne zajęcia "na styk" przedłużają zajętość),
 *  - wolna: until = początek najbliższych zajęć (albo null, gdy już ich nie ma).
 */
export function memberStatus(events, nowMin) {
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  )

  const current = sorted.find(
    (event) =>
      timeToMinutes(event.start_time) <= nowMin &&
      nowMin < timeToMinutes(event.end_time)
  )

  if (current) {
    let busyUntil = timeToMinutes(current.end_time)
    for (const event of sorted) {
      const start = timeToMinutes(event.start_time)
      const end = timeToMinutes(event.end_time)
      if (start <= busyUntil && end > busyUntil) busyUntil = end
    }
    return { busy: true, until: busyUntil, title: current.title }
  }

  const next = sorted.find((event) => timeToMinutes(event.start_time) > nowMin)
  return {
    busy: false,
    until: next ? timeToMinutes(next.start_time) : null,
    title: next?.title ?? null,
  }
}

/**
 * Najbliższe okienko, w którym wszyscy mają wolne, liczone od chwili nowMin.
 * Jeśli zaczyna się teraz (startMin === nowMin), wszyscy są wolni w tej chwili.
 */
export function nextCommonSlot(dayEvents, nowMin, { endMin, minDuration, day }) {
  const slots = findCommonFreeSlots(dayEvents, {
    dayStartMin: nowMin,
    dayEndMin: endMin,
    minDuration,
    days: [day],
  })

  return slots[0] ?? null
}