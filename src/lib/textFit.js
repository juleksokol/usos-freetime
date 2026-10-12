/**
 * Liczy, ile linii zajmie tekst po zawinięciu słowami w podanej szerokości.
 * measure(text) zwraca szerokość tekstu w pikselach (np. z canvas.measureText).
 * Słowo dłuższe niż linia jest łamane na kilka linii.
 */
export function countWrappedLines(text, maxWidth, measure) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0

  let lines = 1
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word

    if (measure(candidate) <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      lines++
      current = ''
    }

    if (measure(word) > maxWidth) {
      let chunk = ''
      for (const char of word) {
        if (chunk && measure(chunk + char) > maxWidth) {
          lines++
          chunk = char
        } else {
          chunk += char
        }
      }
      current = chunk
    } else {
      current = word
    }
  }

  return lines
}