// Zamienia zagnieżdżony słownik na płaski: { a: { b: 'x' } } -> { 'a.b': 'x' }.
// Dzięki temu w plikach ze słownikami nie powtarzamy długich przedrostków kluczy.
export function flatten(tree, prefix = '') {
  const result = {}

  for (const [key, value] of Object.entries(tree)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[full] = value
    else Object.assign(result, flatten(value, full))
  }

  return result
}
