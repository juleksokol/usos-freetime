// Komunikaty błędów logowania i zmiany hasła po polsku.
// context: 'login' | 'register' | 'change' | 'reset'

const RATE_LIMIT = /rate.?limit|too many|after \d+ seconds|over_.*_limit/i

const WEAK_REASONS = {
  length: 'jest za krótkie',
  characters: 'brakuje wymaganych rodzajów znaków',
  pwned: 'pojawiło się w publicznych wyciekach haseł',
}

export function authErrorText(error, context = 'login') {
  const message = String(error?.message ?? '')
  const code = String(error?.code ?? '')

  if (!message && !code) return 'Wystąpił nieznany błąd.'

  if (code === 'current_password_invalid' || code === 'current_password_required') {
    return 'Aktualne hasło jest nieprawidłowe.'
  }
  if (code === 'invalid_credentials' || message.includes('Invalid login credentials')) {
    return context === 'change'
      ? 'Aktualne hasło jest nieprawidłowe.'
      : 'Nieprawidłowy e-mail lub hasło.'
  }
  if (code === 'user_already_exists' || message.includes('User already registered')) {
    return 'Konto z tym adresem e-mail już istnieje.'
  }
  if (code === 'email_not_confirmed' || message.includes('Email not confirmed')) {
    return 'Potwierdź adres e-mail, klikając link, który do Ciebie wysłaliśmy.'
  }
  if (code === 'same_password' || /different from the old password/i.test(message)) {
    return 'Nowe hasło musi się różnić od obecnego.'
  }
  if (
    code === 'weak_password' ||
    /weak password|password should|password is known to be weak/i.test(message)
  ) {
    const reasons = Array.isArray(error?.reasons)
      ? error.reasons.map((reason) => WEAK_REASONS[reason]).filter(Boolean)
      : []

    return reasons.length > 0
      ? `Hasło nie spełnia wymagań serwera: ${reasons.join(', ')}.`
      : 'Hasło jest zbyt słabe. Spełnij wszystkie wymagania z listy.'
  }
  if (
    code === 'otp_expired' ||
    /token has expired|otp.*(expired|invalid)|invalid.*(otp|token)/i.test(message)
  ) {
    return 'Kod jest nieprawidłowy lub wygasł. Poproś o nowy kod.'
  }
  if (
    code === 'session_not_found' ||
    code === 'session_expired' ||
    /auth session missing|session.*(expired|not found)/i.test(message)
  ) {
    return 'Sesja wygasła. Wróć do logowania i poproś o nowy kod resetu hasła.'
  }
  if (RATE_LIMIT.test(code) || RATE_LIMIT.test(message)) {
    return 'Zbyt wiele prób. Odczekaj chwilę (około minuty) i spróbuj ponownie.'
  }
  if (/valid email|invalid email/i.test(message)) {
    return 'Podaj poprawny adres e-mail.'
  }
  if (/failed to fetch|network|load failed/i.test(message)) {
    return 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.'
  }

  return message || 'Wystąpił nieznany błąd.'
}