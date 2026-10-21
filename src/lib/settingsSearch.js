import { normalizeText } from './text'

// Tekst pola sekcji lub wiersza: z klucza tłumaczenia (xxxKey) albo zwykły napis
const text = (item, name, t) => (item[`${name}Key`] ? t(item[`${name}Key`]) : (item[name] ?? ''))

// Tekst, w którym szukamy: tytuł, opis, słowa kluczowe oraz opisy wierszy sekcji
export function sectionText(section, t) {
  const rowText = (section.rows ?? [])
    .map((row) => `${text(row, 'label', t)} ${text(row, 'hint', t)}`)
    .join(' ')

  return normalizeText(
    [
      text(section, 'title', t),
      text(section, 'description', t),
      text(section, 'keywords', t),
      rowText,
    ]
      .filter(Boolean)
      .join(' ')
  )
}

// Wszystkie wpisane słowa muszą pasować (bez wielkości liter i polskich znaków)
export function sectionMatches(section, query, t) {
  const tokens = normalizeText(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = sectionText(section, t)
  return tokens.every((token) => haystack.includes(token))
}

// Zwraca grupy z samymi pasującymi sekcjami (puste grupy znikają)
export function filterGroups(groups, query, t) {
  return groups
    .map((group) => ({
      ...group,
      sections: group.sections.filter((section) => sectionMatches(section, query, t)),
    }))
    .filter((group) => group.sections.length > 0)
}
