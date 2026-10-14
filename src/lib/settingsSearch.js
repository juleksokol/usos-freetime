import { normalizeText } from './text'

// Tekst, w którym szukamy: tytuł, opis, słowa kluczowe oraz opisy wierszy sekcji
export function sectionText(section) {
  const rowText = (section.rows ?? [])
    .map((row) => `${row.label} ${row.hint ?? ''}`)
    .join(' ')

  return normalizeText(
    [section.title, section.description, section.keywords, rowText]
      .filter(Boolean)
      .join(' ')
  )
}

// Wszystkie wpisane słowa muszą pasować (bez wielkości liter i polskich znaków)
export function sectionMatches(section, query) {
  const tokens = normalizeText(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = sectionText(section)
  return tokens.every((token) => haystack.includes(token))
}

// Zwraca grupy z samymi pasującymi sekcjami (puste grupy znikają)
export function filterGroups(groups, query) {
  return groups
    .map((group) => ({
      ...group,
      sections: group.sections.filter((section) => sectionMatches(section, query)),
    }))
    .filter((group) => group.sections.length > 0)
}