import { describe, expect, it } from 'vitest'
import { describeFriendView, effectiveVisibility, friendView } from '../visibility'

describe('widoczność zajęć dla znajomych', () => {
  const rules = { Algebra: 'hidden', Fizyka: 'busy' }

  it('ustawienie terminu ma pierwszeństwo przed regułą przedmiotu', () => {
    expect(effectiveVisibility({ title: 'Algebra', visibility: 'busy' }, rules)).toBe('busy')
    expect(effectiveVisibility({ title: 'Algebra', visibility: 'default' }, rules)).toBe('hidden')
    expect(effectiveVisibility({ title: 'Algebra' }, rules)).toBe('hidden')
  })

  it('bez ustawień obowiązuje wartość domyślna', () => {
    expect(effectiveVisibility({ title: 'Chemia', visibility: 'default' }, rules)).toBe('default')
    expect(effectiveVisibility({ title: 'Chemia' }, undefined)).toBe('default')
  })

  it('wylicza, co zobaczy znajomy (tak jak funkcja w bazie)', () => {
    // domyślnie: zależy od ustawienia konta
    expect(friendView({ title: 'Chemia' }, rules, true)).toBe('full')
    expect(friendView({ title: 'Chemia' }, rules, false)).toBe('busy')
    // „Tylko Zajęty” działa nawet przy włączonym udostępnianiu szczegółów
    expect(friendView({ title: 'Fizyka' }, rules, true)).toBe('busy')
    // ukryte zajęcia znikają niezależnie od ustawienia konta
    expect(friendView({ title: 'Algebra' }, rules, true)).toBe('none')
    expect(friendView({ title: 'Algebra' }, rules, false)).toBe('none')
    // pojedynczy termin może przywrócić widoczność tylko jako „Zajęty”
    expect(friendView({ title: 'Algebra', visibility: 'busy' }, rules, true)).toBe('busy')
  })

  it('opisuje widok znajomego po polsku', () => {
    expect(describeFriendView('full')).toContain('szczegóły')
    expect(describeFriendView('busy')).toContain('Zajęty')
    expect(describeFriendView('none')).toContain('nie widzą')
  })
})