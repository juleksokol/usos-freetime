import { WORKDAYS } from './constants'
import { timeToMinutes } from './timeUtils'

/**
 * Wyznacza przedziały, w których NIKT z podanych osób nie ma zajęć.
 *
 * events:  zajęcia wszystkich wybranych osób z jednego tygodnia
 *          (pola: day_of_week, start_time, end_time)
 * options: { dayStartMin, dayEndMin, minDuration } (w minutach)
 *
 * Zwraca: [{ day, startMin, endMin }]
 */
export function findCommonFreeSlots(
  events,
  { dayStartMin, dayEndMin, minDuration }
) {
  const slots = []

  for (const day of WORKDAYS) {
    const busy = events
      .filter((event) => event.day_of_week === day)
      .map((event) => [
        Math.max(timeToMinutes(event.start_time), dayStartMin),
        Math.min(timeToMinutes(event.end_time), dayEndMin),
      ])
      .filter(([start, end]) => end > start)
      .sort((a, b) => a[0] - b[0])

    // Przesuwamy "kursor" po dniu; każda luka między zajęciami to potencjalne okienko
    let cursor = dayStartMin
    for (const [start, end] of busy) {
      if (start - cursor >= minDuration) {
        slots.push({ day, startMin: cursor, endMin: start })
      }
      cursor = Math.max(cursor, end)
    }

    if (dayEndMin - cursor >= minDuration) {
      slots.push({ day, startMin: cursor, endMin: dayEndMin })
    }
  }

  return slots
}