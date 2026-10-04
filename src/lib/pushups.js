import { addDays, daysBetween } from './dateUtils'

/**
 * Licznik pompek: w dniu startu startCount, potem + increment co każde pełne 7 dni.
 * config: { startDate: "RRRR-MM-DD", startCount, increment }
 */
export function computePushups({ startDate, startCount, increment }, today) {
  const diff = daysBetween(startDate, today)

  if (diff < 0) {
    return {
      started: false,
      count: startCount,
      dayNumber: 0,
      week: 0,
      dayInWeek: 0,
      nextIn: -diff,
      nextCount: startCount,
      nextDate: startDate,
    }
  }

  const weeks = Math.floor(diff / 7)
  const count = startCount + weeks * increment
  const nextIn = 7 - (diff % 7)

  return {
    started: true,
    count,
    dayNumber: diff + 1,
    week: weeks + 1,
    dayInWeek: (diff % 7) + 1,
    nextIn,
    nextCount: count + increment,
    nextDate: addDays(today, nextIn),
  }
}