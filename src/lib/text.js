// Małe litery, bez polskich znaków diakrytycznych i znaków specjalnych (do wyszukiwania)
export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}