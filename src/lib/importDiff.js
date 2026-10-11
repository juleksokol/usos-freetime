// Porównanie zapisanego planu z nowo importowanym (zajęcia z importu, bez własnych wydarzeń)

const hhmm = (time) => String(time).slice(0, 5)

// Zajęcia w danym terminie: data (albo dzień tygodnia dla szablonu) + nazwa
const slotKey = (event) =>
  `${event.event_date ?? `d${event.day_of_week}`}|${event.title}`

// Godziny i miejsce
const detailsKey = (event) =>
  `${hhmm(event.start_time)}-${hhmm(event.end_time)}|${event.location ?? ''}`

const fullKey = (event) => `${slotKey(event)}|${detailsKey(event)}`

/**
 * Zwraca:
 *  unchanged: liczba niezmienionych zajęć,
 *  added:     nowe zajęcia,
 *  removed:   zajęcia, których już nie ma,
 *  changed:   [{ before, after }] ten sam przedmiot i termin, inne godziny lub sala,
 *  moved:     [{ from, to }] te same godziny i sala w innym terminie (np. przesunięte na inny dzień).
 */
export function diffImports(oldEvents, newEvents) {
  // 1) Dokładne dopasowanie (z obsługą powtórzeń)
  const oldByKey = new Map()
  for (const event of oldEvents) {
    const key = fullKey(event)
    if (!oldByKey.has(key)) oldByKey.set(key, [])
    oldByKey.get(key).push(event)
  }

  let unchanged = 0
  let added = []

  for (const event of newEvents) {
    const bucket = oldByKey.get(fullKey(event))
    if (bucket && bucket.length > 0) {
      bucket.pop()
      unchanged++
    } else {
      added.push(event)
    }
  }

  let removed = Array.from(oldByKey.values()).flat()

  // 2) Ten sam przedmiot i termin, ale zmienione godziny lub sala
  const changed = []
  const removedBySlot = new Map()
  for (const event of removed) {
    const key = slotKey(event)
    if (!removedBySlot.has(key)) removedBySlot.set(key, [])
    removedBySlot.get(key).push(event)
  }

  const stillAdded = []
  for (const event of added) {
    const bucket = removedBySlot.get(slotKey(event))
    if (bucket && bucket.length > 0) {
      changed.push({ before: bucket.shift(), after: event })
    } else {
      stillAdded.push(event)
    }
  }
  added = stillAdded
  removed = Array.from(removedBySlot.values()).flat()

  // 3) Te same godziny i sala w innym terminie = przesunięcie
  const moved = []
  const sortByDate = (a, b) =>
    (a.event_date ?? '').localeCompare(b.event_date ?? '') ||
    a.day_of_week - b.day_of_week

  const removedByShape = new Map()
  for (const event of [...removed].sort(sortByDate)) {
    const key = `${event.title}|${detailsKey(event)}`
    if (!removedByShape.has(key)) removedByShape.set(key, [])
    removedByShape.get(key).push(event)
  }

  const finalAdded = []
  for (const event of [...added].sort(sortByDate)) {
    const bucket = removedByShape.get(`${event.title}|${detailsKey(event)}`)
    if (bucket && bucket.length > 0) {
      moved.push({ from: bucket.shift(), to: event })
    } else {
      finalAdded.push(event)
    }
  }

  return {
    unchanged,
    added: finalAdded,
    removed: Array.from(removedByShape.values()).flat(),
    changed,
    moved,
  }
}

export function hasChanges(diff) {
  return (
    diff.added.length > 0 ||
    diff.removed.length > 0 ||
    diff.changed.length > 0 ||
    diff.moved.length > 0
  )
}