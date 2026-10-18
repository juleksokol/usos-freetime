import { useEffect, useId, useState } from 'react'
import { CalendarClock, KeyRound, Loader2, LogIn, Mail, User, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authErrorText } from '../lib/authErrors'
import { isPasswordValid } from '../lib/passwordPolicy'
import { getRememberPreference } from '../lib/session'
import PasswordChecklist from './password/PasswordChecklist'
import PasswordField from './password/PasswordField'

const RESEND_SECONDS = 60

const TITLES = {
  login: 'Zaloguj się',
  register: 'Załóż konto',
  forgot: 'Reset hasła',
  code: 'Wpisz kod z e-maila',
  newpass: 'Ustaw nowe hasło',
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

const linkClass =
  'text-sm text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

// Pole tekstowe z widoczną etykietą (etykieta, a nie sam placeholder, jest czytana przez czytniki ekranu)
function TextField({
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  autoComplete,
  autoFocus = false,
  inputMode,
  pattern,
  maxLength,
}) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500"
          aria-hidden="true"
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          inputMode={inputMode}
          pattern={pattern}
          maxLength={maxLength}
          required
          className={inputClass}
        />
      </div>
    </div>
  )
}

export default function AuthForm() {
  const {
    signIn,
    signUp,
    recovering,
    requestPasswordReset,
    verifyResetCode,
    completePasswordReset,
    cancelPasswordReset,
  } = useAuth()
  const checklistId = useId()

  // 'login' | 'register' | 'forgot' | 'code' | 'newpass'
  const [mode, setMode] = useState(() => (recovering ? 'newpass' : 'login'))
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [remember, setRemember] = useState(getRememberPreference)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cooldown, setCooldown] = useState(0) // sekundy do ponownego wysłania kodu

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const go = (next) => {
    setMode(next)
    setError('')
    setInfo('')
    setPassword('')
    setConfirm('')
    setCode('')
  }

  const sendCode = async () => {
    const { error: sendError } = await requestPasswordReset(email)
    if (sendError) {
      setError(authErrorText(sendError, 'reset'))
      return false
    }

    setCooldown(RESEND_SECONDS)
    return true
  }

  const doLogin = async () => {
    const { error: signInError } = await signIn(email.trim(), password, remember)
    if (signInError) setError(authErrorText(signInError, 'login'))
  }

  const doRegister = async () => {
    const name = displayName.trim()
    if (!name) {
      setError('Podaj imię lub pseudonim, który zobaczą znajomi.')
      return
    }
    if (!isPasswordValid(password, { email })) {
      setError('Hasło nie spełnia wszystkich wymagań z listy.')
      return
    }
    if (password !== confirm) {
      setError('Hasło i jego powtórzenie nie są takie same.')
      return
    }

    const { data, error: signUpError } = await signUp(email.trim(), password, name, remember)
    if (signUpError) {
      setError(authErrorText(signUpError, 'register'))
      return
    }

    // Gdy w Supabase włączone jest potwierdzanie e-mail, sesja jest pusta
    if (!data.session) {
      go('login')
      setInfo(
        'Konto utworzone. Sprawdź skrzynkę e-mail i potwierdź adres, a następnie zaloguj się.'
      )
    }
  }

  const doRequestCode = async () => {
    if (await sendCode()) {
      go('code')
      setInfo(
        `Jeśli konto ${email.trim()} istnieje, wysłaliśmy na ten adres kod. Wpisz go poniżej.`
      )
    }
  }

  const doVerifyCode = async () => {
    const { error: verifyError } = await verifyResetCode(email, code)
    if (verifyError) {
      setError(authErrorText(verifyError, 'reset'))
      return
    }

    go('newpass')
    setInfo('Kod jest poprawny. Ustaw nowe hasło.')
  }

  const doNewPassword = async () => {
    if (!isPasswordValid(password, { email })) {
      setError('Hasło nie spełnia wszystkich wymagań z listy.')
      return
    }
    if (password !== confirm) {
      setError('Hasło i jego powtórzenie nie są takie same.')
      return
    }

    // Po sukcesie AuthProvider kończy reset i aplikacja otwiera się sama
    const { error: resetError } = await completePasswordReset(password)
    if (resetError) setError(authErrorText(resetError, 'reset'))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    try {
      if (mode === 'login') await doLogin()
      else if (mode === 'register') await doRegister()
      else if (mode === 'forgot') await doRequestCode()
      else if (mode === 'code') await doVerifyCode()
      else await doNewPassword()
    } finally {
      setSubmitting(false)
    }
  }

  const resendCode = async () => {
    setError('')
    setInfo('')
    setSubmitting(true)

    try {
      if (await sendCode()) setInfo('Wysłaliśmy nowy kod.')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelReset = async () => {
    await cancelPasswordReset()
    go('login')
  }

  const SubmitIcon = { login: LogIn, register: UserPlus, forgot: Mail, code: KeyRound, newpass: KeyRound }[
    mode
  ]
  const submitLabel = {
    login: 'Zaloguj się',
    register: 'Załóż konto',
    forgot: 'Wyślij kod',
    code: 'Sprawdź kod',
    newpass: 'Zapisz nowe hasło',
  }[mode]

  const subtitle = {
    login: 'Nałóż plany zajęć ze znajomymi i znajdź wspólne okienko na obiad.',
    register: 'Nałóż plany zajęć ze znajomymi i znajdź wspólne okienko na obiad.',
    forgot: 'Podaj adres e-mail konta. Wyślemy na niego kod do ustawienia nowego hasła.',
    code: `Wpisz kod z wiadomości wysłanej na adres ${email.trim() || 'konta'}.`,
    newpass: 'Wybierz nowe hasło do konta.',
  }[mode]

  const showRemember = mode === 'login' || mode === 'register'

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <CalendarClock className="h-12 w-12 text-indigo-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-800">USOS FreeTime</h1>
        </div>

        <h2 className="text-lg font-semibold text-slate-800">{TITLES[mode]}</h2>
        <p className="mb-5 mt-1 text-sm text-slate-600">{subtitle}</p>

        <form key={mode} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <TextField
              label="Imię lub pseudonim"
              icon={User}
              value={displayName}
              onChange={setDisplayName}
              autoComplete="nickname"
              autoFocus
            />
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <TextField
              label="Adres e-mail"
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              autoFocus={mode !== 'register'}
            />
          )}

          {mode === 'code' && (
            <TextField
              label="Kod z e-maila"
              icon={KeyRound}
              value={code}
              onChange={(value) => setCode(value.replace(/\D/g, ''))}
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6,10}"
              maxLength={10}
              autoFocus
            />
          )}

          {(mode === 'login' || mode === 'register' || mode === 'newpass') && (
            <PasswordField
              label={mode === 'newpass' ? 'Nowe hasło' : 'Hasło'}
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              describedBy={mode === 'login' ? undefined : checklistId}
              autoFocus={mode === 'newpass'}
            />
          )}

          {(mode === 'register' || mode === 'newpass') && (
            <>
              <PasswordField
                label="Powtórz hasło"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                invalid={confirm !== '' && confirm !== password}
              />
              <PasswordChecklist id={checklistId} password={password} email={email} />
            </>
          )}

          {showRemember && (
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
              />
              <span>
                Zapamiętaj mnie
                <span className="block text-xs text-slate-600">
                  Odznacz na cudzym urządzeniu: wylogujemy Cię po zamknięciu przeglądarki.
                </span>
              </span>
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <SubmitIcon className="h-5 w-5" aria-hidden="true" />
            )}
            {submitLabel}
          </button>

          {mode === 'code' && (
            <button
              type="button"
              onClick={resendCode}
              disabled={submitting || cooldown > 0}
              className={`${linkClass} self-start disabled:cursor-not-allowed disabled:text-slate-500 disabled:no-underline`}
            >
              {cooldown > 0 ? `Wyślij kod ponownie za ${cooldown} s` : 'Wyślij kod ponownie'}
            </button>
          )}
        </form>

        <div className="mt-5 flex flex-col items-center gap-2">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => go('forgot')} className={linkClass}>
                Nie pamiętasz hasła?
              </button>
              <button type="button" onClick={() => go('register')} className={linkClass}>
                Nie masz konta? Zarejestruj się
              </button>
            </>
          )}
          {mode === 'register' && (
            <button type="button" onClick={() => go('login')} className={linkClass}>
              Masz już konto? Zaloguj się
            </button>
          )}
          {(mode === 'forgot' || mode === 'code') && (
            <button type="button" onClick={() => go('login')} className={linkClass}>
              Wróć do logowania
            </button>
          )}
          {mode === 'newpass' && (
            <button type="button" onClick={cancelReset} className={linkClass}>
              Anuluj
            </button>
          )}
        </div>
      </div>
    </main>
  )
}