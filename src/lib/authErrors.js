// Komunikaty błędów logowania i zmiany hasła w języku interfejsu.
// context: 'login' | 'register' | 'change' | 'reset'; t: funkcja tłumacząca z useI18n()

const RATE_LIMIT = /rate.?limit|too many|after \d+ seconds|over_.*_limit/i

const WEAK_REASON_KEYS = {
  length: 'autherr.reason.length',
  characters: 'autherr.reason.characters',
  pwned: 'autherr.reason.pwned',
}

export function authErrorText(error, context, t) {
  const message = String(error?.message ?? '')
  const code = String(error?.code ?? '')

  if (!message && !code) return t('autherr.unknown')

  if (code === 'current_password_invalid' || code === 'current_password_required') {
    return t('autherr.wrongCurrent')
  }
  if (code === 'invalid_credentials' || message.includes('Invalid login credentials')) {
    return t(context === 'change' ? 'autherr.wrongCurrent' : 'autherr.badCredentials')
  }
  if (code === 'user_already_exists' || message.includes('User already registered')) {
    return t('autherr.userExists')
  }
  if (code === 'email_not_confirmed' || message.includes('Email not confirmed')) {
    return t('autherr.emailNotConfirmed')
  }
  if (code === 'same_password' || /different from the old password/i.test(message)) {
    return t('autherr.samePassword')
  }
  if (
    code === 'weak_password' ||
    /weak password|password should|password is known to be weak/i.test(message)
  ) {
    const reasons = Array.isArray(error?.reasons)
      ? error.reasons.map((reason) => WEAK_REASON_KEYS[reason]).filter(Boolean).map((key) => t(key))
      : []

    return reasons.length > 0
      ? t('autherr.weakReasons', { reasons: reasons.join(', ') })
      : t('autherr.weak')
  }
  if (
    code === 'otp_expired' ||
    /token has expired|otp.*(expired|invalid)|invalid.*(otp|token)/i.test(message)
  ) {
    return t('autherr.otp')
  }
  if (
    code === 'session_not_found' ||
    code === 'session_expired' ||
    /auth session missing|session.*(expired|not found)/i.test(message)
  ) {
    return t('autherr.session')
  }
  if (RATE_LIMIT.test(code) || RATE_LIMIT.test(message)) {
    return t('autherr.rate')
  }
  if (/valid email|invalid email/i.test(message)) {
    return t('autherr.email')
  }
  if (/failed to fetch|network|load failed/i.test(message)) {
    return t('autherr.network')
  }

  return message || t('autherr.unknown')
}