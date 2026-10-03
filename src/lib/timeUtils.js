// "08:30" lub "08:30:00" -> 510
export function timeToMinutes(value) {
  const [hours, minutes] = String(value).split(':')
  return Number(hours) * 60 + Number(minutes)
}

// 510 -> "08:30"
export function minutesToTime(total) {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}