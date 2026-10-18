import { describe, expect, it } from 'vitest'
import { authErrorText } from '../authErrors'

describe('komunikaty błędów logowania', () => {
  it('rozróżnia błędne dane logowania i błędne aktualne hasło', () => {
    const error = { message: 'Invalid login credentials', code: 'invalid_credentials' }
    expect(authErrorText(error, 'login')).toBe('Nieprawidłowy e-mail lub hasło.')
    expect(authErrorText(error, 'change')).toBe('Aktualne hasło jest nieprawidłowe.')
    expect(authErrorText({ code: 'current_password_invalid', message: 'x' }, 'change')).toBe(
      'Aktualne hasło jest nieprawidłowe.'
    )
  })

  it('opisuje słabe hasło z powodami z serwera', () => {
    const text = authErrorText(
      { code: 'weak_password', message: 'Password should be...', reasons: ['length', 'pwned'] },
      'register'
    )
    expect(text).toContain('jest za krótkie')
    expect(text).toContain('wyciekach')
    expect(authErrorText({ code: 'weak_password', message: 'weak' }, 'register')).toContain('zbyt słabe')
  })

  it('obsługuje kod resetu, to samo hasło i limity', () => {
    expect(authErrorText({ code: 'otp_expired', message: 'Token has expired or is invalid' }, 'reset')).toContain('Poproś o nowy kod')
    expect(authErrorText({ code: 'same_password', message: 'New password should be different from the old password.' }, 'change')).toContain('musi się różnić')
    expect(authErrorText({ code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' }, 'reset')).toContain('Zbyt wiele prób')
    expect(authErrorText({ message: 'For security purposes, you can only request this after 45 seconds.' }, 'reset')).toContain('Zbyt wiele prób')
  })

  it('obsługuje brak sesji, brak sieci i nieznane błędy', () => {
    expect(authErrorText({ message: 'Auth session missing!' }, 'reset')).toContain('Sesja wygasła')
    expect(authErrorText({ message: 'Failed to fetch' }, 'login')).toContain('Brak połączenia')
    expect(authErrorText({ message: 'Coś dziwnego' }, 'login')).toBe('Coś dziwnego')
    expect(authErrorText(null)).toBe('Wystąpił nieznany błąd.')
  })
})