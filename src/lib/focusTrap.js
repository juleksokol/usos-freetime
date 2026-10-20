/**
 * Pułapka fokusu w oknie dialogowym: dokąd przenieść fokus po naciśnięciu Tab.
 * count: liczba elementów w oknie, index: bieżący element (-1, gdy fokus jest poza oknem),
 * shift: czy wciśnięto Shift+Tab. Zwraca indeks do zaznaczenia albo null, gdy przeglądarka
 * ma sama przejść do następnego elementu.
 */
export function nextTrapIndex({ count, index, shift }) {
  if (count <= 0) return null
  if (index === -1) return shift ? count - 1 : 0
  if (!shift && index === count - 1) return 0
  if (shift && index === 0) return count - 1
  return null
}