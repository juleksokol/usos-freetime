import { DAY_NAMES } from './constants'

/**
 * Pełny opis kafelka zajęć dla czytników ekranu (kafelek jest przyciskiem, a widoczny tekst
 * bywa skrócony). block: { event, ownerName, watermark, marker }
 */
export function tileAriaLabel(block, { picker = false } = {}) {
  const { event, ownerName, watermark, marker } = block
  const day = DAY_NAMES[event.day_of_week]?.toLowerCase() ?? ''
  const time = `${event.start_time.slice(0, 5)}–${event.end_time.slice(0, 5)}`

  return [
    picker ? `Dodaj sprawdzian dla zajęć: ${event.title}` : event.title,
    watermark ? `osoba: ${ownerName}` : null,
    `${day} ${time}`.trim(),
    event.location ? `miejsce: ${event.location}` : null,
    event.event_type,
    event.teacher ? `prowadzący: ${event.teacher}` : null,
    marker ? `sprawdzian: ${marker.label}` : null,
  ]
    .filter(Boolean)
    .join(', ')
}