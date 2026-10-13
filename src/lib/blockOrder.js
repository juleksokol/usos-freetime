// Kolejność bloków i zakładek zapisywana w ustawieniach (lista identyfikatorów)

/**
 * Łączy zapisaną kolejność z aktualną listą bloków:
 * zapisane identyfikatory, które nadal istnieją, zachowują kolejność,
 * a nowe bloki (których nie było w zapisie) trafiają na koniec.
 */
export function resolveOrder(saved, ids) {
  const known = Array.isArray(saved)
    ? [...new Set(saved.filter((id) => ids.includes(id)))]
    : []

  return [...known, ...ids.filter((id) => !known.includes(id))]
}

/**
 * Wstawia nową kolejność widocznych elementów do pełnej listy,
 * zostawiając ukryte elementy na ich dotychczasowych miejscach.
 */
export function mergeVisibleOrder(fullOrder, newVisibleOrder) {
  const visible = new Set(newVisibleOrder)
  const queue = [...newVisibleOrder]

  return fullOrder.map((id) => (visible.has(id) ? queue.shift() : id))
}