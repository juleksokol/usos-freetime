import { describe, expect, it } from 'vitest'
import { mergeVisibleOrder, resolveOrder } from '../blockOrder'

describe('kolejność bloków', () => {
  const ids = ['a', 'b', 'c', 'd']

  it('bez zapisu zwraca domyślną kolejność', () => {
    expect(resolveOrder(undefined, ids)).toEqual(['a', 'b', 'c', 'd'])
    expect(resolveOrder([], ids)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('zachowuje zapisaną kolejność, pomija nieistniejące i dokłada nowe na koniec', () => {
    expect(resolveOrder(['c', 'x', 'a'], ids)).toEqual(['c', 'a', 'b', 'd'])
    expect(resolveOrder(['b', 'b', 'a'], ids)).toEqual(['b', 'a', 'c', 'd'])
  })

  it('nowa kolejność widocznych zachowuje miejsca ukrytych elementów', () => {
    // b jest ukryty i zostaje na swoim miejscu, a widoczne a, c, d zmieniają kolejność
    expect(mergeVisibleOrder(['a', 'b', 'c', 'd'], ['d', 'a', 'c'])).toEqual([
      'd',
      'b',
      'a',
      'c',
    ])
  })

  it('bez ukrytych elementów zwraca nową kolejność', () => {
    expect(mergeVisibleOrder(['a', 'b', 'c'], ['c', 'b', 'a'])).toEqual(['c', 'b', 'a'])
  })
})