import { describe, expect, it } from 'vitest'
import {
  PASSWORD_MIN_LENGTH,
  evaluatePassword,
  failedRuleIds,
  isPasswordValid,
  needsPasswordChange,
} from '../passwordPolicy'

describe('wymagania hasła', () => {
  it('akceptuje mocne hasło', () => {
    expect(isPasswordValid('Zielony-Rower#2026')).toBe(true)
    expect(failedRuleIds('Zielony-Rower#2026')).toEqual([])
  })

  it('wymaga długości, małej i wielkiej litery, cyfry oraz symbolu', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(10)
    expect(failedRuleIds('Krotkie1!')).toEqual(['length'])
    expect(failedRuleIds('WIELKIELITERY1234!')).toEqual(['lower'])
    expect(failedRuleIds('malelitery1234!')).toEqual(['upper'])
    expect(failedRuleIds('BezCyfrDlugie!')).toEqual(['digit'])
    expect(failedRuleIds('BezSymboli12345')).toEqual(['symbol'])
  })

  it('symbole są takie jak w Supabase (spacja i € nie są symbolami)', () => {
    expect(failedRuleIds('Abcdefghij 1')).toContain('symbol')
    expect(failedRuleIds('Abcdefghij1€')).toContain('symbol')
    expect(failedRuleIds('Abcdefghij1~')).toEqual([])
  })

  it('hasło nie może zawierać części adresu e-mail', () => {
    const options = { email: 'jan.kowalski@student.agh.edu.pl' }
    expect(failedRuleIds('Jan.Kowalski#2026', options)).toEqual(['email'])
    expect(isPasswordValid('Zielony-Rower#2026', options)).toBe(true)
    // krótka część przed @ nie jest sprawdzana
    expect(isPasswordValid('Zielony-Rower#2026', { email: 'ab@x.pl' })).toBe(true)
  })

  it('odrzuca popularne hasła z dopiskami', () => {
    expect(failedRuleIds('Password123!')).toEqual(['common'])
    expect(failedRuleIds('Student2026!!')).toEqual(['common'])
    expect(isPasswordValid('Passwordowy-Pies#77')).toBe(true)
  })

  it('ogranicza długość do 72 bajtów (polskie litery liczą się podwójnie)', () => {
    const long = `Aa1!${'x'.repeat(69)}`
    expect(long.length).toBe(73)
    expect(failedRuleIds(long)).toEqual(['max'])

    const polish = `Aa1!${'ł'.repeat(35)}` // 39 znaków, 74 bajty
    expect(polish.length).toBe(39)
    expect(failedRuleIds(polish)).toEqual(['max'])

    expect(failedRuleIds(`Aa1!${'x'.repeat(68)}`)).toEqual([])
  })

  it('zwraca wszystkie wymagania w stałej kolejności', () => {
    expect(evaluatePassword('').map((rule) => rule.id)).toEqual([
      'length',
      'lower',
      'upper',
      'digit',
      'symbol',
      'email',
      'common',
      'max',
    ])
  })

  it('wymusza zmianę hasła po słabym logowaniu albo przy fladze na koncie', () => {
    const user = { user_metadata: {} }
    expect(needsPasswordChange({ user, weakLogin: false })).toBe(false)
    expect(needsPasswordChange({ user, weakLogin: true })).toBe(true)
    expect(
      needsPasswordChange({ user: { user_metadata: { password_change_required: true } } })
    ).toBe(true)
    expect(needsPasswordChange({ user: null, weakLogin: true })).toBe(false)
  })
})