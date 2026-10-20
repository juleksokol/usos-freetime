import { describe, expect, it } from 'vitest'
import { authErrorText } from '../authErrors'
import { DICTIONARIES, createTranslator } from '../i18n'

const tPl = createTranslator('pl', DICTIONARIES)
const tEn = createTranslator('en', DICTIONARIES)

describe('komunikaty błędów logowania', () => {
  it('rozróżnia błędne dane logowania i błędne aktualne hasło', () => {
    const error = { message: 'Invalid login credentials', code: 'invalid_credentials' }
    expect(authErrorText(error, 'login', tPl)).toBe('Nieprawidłowy e-mail lub hasło.')
    expect(authErrorText(error, 'change', tPl)).toBe('Aktualne hasło jest nieprawidłowe.')
    expect(authErrorText({ code: 'current_password_invalid', message: 'x' }, 'change', tPl)).toBe(
      'Aktualne hasło jest nieprawidłowe.'
    )
  })

  it('opisuje słabe hasło z powodami z serwera', () => {
    const text = authErrorText(
      { code: 'weak_password', message: 'Password should be...', reasons: ['length', 'pwned'] },
      'register',
      tPl
    )
    expect(text).toContain('jest za krótkie')
    expect(text).toContain('wyciekach')
    expect(authErrorText({ code: 'weak_password', message: 'weak' }, 'register', tPl)).toContain('zbyt słabe')
  })

  it('obsługuje kod resetu, to samo hasło i limity', () => {
    expect(authErrorText({ code: 'otp_expired', message: 'Token has expired or is invalid' }, 'reset', tPl)).toContain('Poproś o nowy kod')
    expect(authErrorText({ code: 'same_password', message: 'New password should be different from the old password.' }, 'change', tPl)).toContain('musi się różnić')
    expect(authErrorText({ code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' }, 'reset', tPl)).toContain('Zbyt wiele prób')
    expect(authErrorText({ message: 'For security purposes, you can only request this after 45 seconds.' }, 'reset', tPl)).toContain('Zbyt wiele prób')
  })

  it('obsługuje brak sesji, brak sieci i nieznane błędy', () => {
    expect(authErrorText({ message: 'Auth session missing!' }, 'reset', tPl)).toContain('Sesja wygasła')
    expect(authErrorText({ message: 'Failed to fetch' }, 'login', tPl)).toContain('Brak połączenia')
    expect(authErrorText({ message: 'Coś dziwnego' }, 'login', tPl)).toBe('Coś dziwnego')
    expect(authErrorText(null, 'login', tPl)).toBe('Wystąpił nieznany błąd.')
  })

  it('te same błędy po angielsku', () => {
    const credentials = { message: 'Invalid login credentials', code: 'invalid_credentials' }
    expect(authErrorText(credentials, 'login', tEn)).toBe('Incorrect email or password.')
    expect(authErrorText(credentials, 'change', tEn)).toBe('The current password is incorrect.')
    expect(
      authErrorText({ code: 'weak_password', message: 'weak', reasons: ['length'] }, 'register', tEn)
    ).toBe('The password does not meet the server requirements: is too short.')
    expect(authErrorText({ code: 'otp_expired', message: 'x' }, 'reset', tEn)).toContain('Request a new code')
    expect(authErrorText(null, 'login', tEn)).toBe('An unknown error occurred.')
  })
})