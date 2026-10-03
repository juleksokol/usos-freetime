import { parseIcs } from './icsParser'
import { parseUsosCsv } from './usosParser'

// Rozpoznaje format po rozszerzeniu lub zawartości: iCal (.ics) albo CSV
export function parseScheduleText(text, fileName = '') {
  const looksLikeIcs =
    /\.ics$/i.test(fileName) ||
    /BEGIN:VCALENDAR/i.test(String(text).slice(0, 2000))

  return looksLikeIcs ? parseIcs(text) : parseUsosCsv(text)
}