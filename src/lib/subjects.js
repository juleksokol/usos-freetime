// Słowa pomijane przy tworzeniu skrótu (spójniki i przyimki, także angielskie)
const SKIPPED_WORDS = new Set([
  'a', 'i', 'o', 'u', 'w', 'z', 'ze', 'we', 'na', 'od', 'po', 'do', 'dla', 'oraz', 'przy',
  'and', 'of', 'the', 'in', 'to', 'for', 'on', 'with',
])

/**
 * Proponuje skrót nazwy przedmiotu z pierwszych liter słów:
 * "Analiza matematyczna I" -> "AMI", "Prawo dla geodetów" -> "PG".
 * Liczby, cyfry rzymskie i krótkie skróty wielkimi literami (np. GIS, 3D) zostają w całości.
 * Nazwa z jednego słowa daje jego początek ("Algebra" -> "ALG").
 * Zajęte skróty (taken) są rozróżniane: "PG" -> "POG" albo "PG2".
 */
export function suggestAbbreviation(title, taken = new Set()) {
  const words = String(title ?? '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

  const parts = []

  for (const word of words) {
    if (
      /^\d+$/.test(word) ||
      /^[IVX]+[a-z]?$/.test(word) ||
      /^[\p{Lu}\p{N}]{2,5}$/u.test(word)
    ) {
      parts.push(word.toUpperCase())
    } else if (!SKIPPED_WORDS.has(word.toLowerCase())) {
      parts.push(word[0].toUpperCase())
    }
  }

  const first = words.find((word) => !SKIPPED_WORDS.has(word.toLowerCase())) ?? ''

  let base = parts.join('')
  if (base.length < 2 && first) base = first.slice(0, 3).toUpperCase()
  base = base.slice(0, 6)

  if (!taken.has(base)) return base

  const longer = (first.slice(0, 2).toUpperCase() + base.slice(1)).slice(0, 6)
  if (longer !== base && !taken.has(longer)) return longer

  for (let i = 2; i < 100; i++) {
    const candidate = `${base.slice(0, 5)}${i}`
    if (!taken.has(candidate)) return candidate
  }

  return base
}