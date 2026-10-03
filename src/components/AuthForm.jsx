import { useState } from 'react'
import {
  CalendarClock,
  Loader2,
  Lock,
  LogIn,
  Mail,
  User,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function translateError(message) {
  if (!message) return 'Wystąpił nieznany błąd.'
  if (message.includes('Invalid login credentials')) {
    return 'Nieprawidłowy e-mail lub hasło.'
  }
  if (message.includes('User already registered')) {
    return 'Konto z tym adresem e-mail już istnieje.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Potwierdź adres e-mail, klikając link, który do Ciebie wysłaliśmy.'
  }
  if (message.includes('Password should be at least')) {
    return 'Hasło musi mieć co najmniej 6 znaków.'
  }
  if (message.toLowerCase().includes('rate limit')) {
    return 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.'
  }
  if (message.toLowerCase().includes('valid email')) {
    return 'Podaj poprawny adres e-mail.'
  }
  return message
}

export default function AuthForm() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const isRegister = mode === 'register'

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register')
    setError('')
    setInfo('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    try {
      if (isRegister) {
        const name = displayName.trim()
        if (!name) {
          setError('Podaj imię lub pseudonim, który zobaczą znajomi.')
          return
        }

        const { data, error: signUpError } = await signUp(
          email.trim(),
          password,
          name
        )
        if (signUpError) {
          setError(translateError(signUpError.message))
          return
        }

        // Gdy w Supabase włączone jest potwierdzanie e-mail, sesja jest pusta
        if (!data.session) {
          setInfo(
            'Konto utworzone. Sprawdź skrzynkę e-mail i potwierdź adres, a następnie zaloguj się.'
          )
          setMode('login')
          setPassword('')
        }
      } else {
        const { error: signInError } = await signIn(email.trim(), password)
        if (signInError) {
          setError(translateError(signInError.message))
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <CalendarClock className="h-12 w-12 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-800">USOS FreeTime</h1>
          <p className="text-center text-sm text-slate-500">
            Nałóż plany zajęć ze znajomymi i znajdź wspólne okienko na obiad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Imię lub pseudonim"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                autoComplete="nickname"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="email"
              placeholder="Adres e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="password"
              placeholder="Hasło (min. 6 znaków)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRegister ? (
              <UserPlus className="h-5 w-5" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            {isRegister ? 'Załóż konto' : 'Zaloguj się'}
          </button>
        </form>

        <button
          type="button"
          onClick={switchMode}
          className="mt-4 w-full text-center text-sm text-indigo-600 hover:underline"
        >
          {isRegister
            ? 'Masz już konto? Zaloguj się'
            : 'Nie masz konta? Zarejestruj się'}
        </button>
      </div>
    </div>
  )
}