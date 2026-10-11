/* global __BUILD_TIME__ */
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import AuthForm from './components/AuthForm'
import PrivacyPage from './components/PrivacyPage'
import Dashboard from './pages/Dashboard'

const PRIVACY_HASH = '#/prywatnosc'

export default function App() {
  const { session, loading } = useAuth()
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Sprawdzenie ekranu błędu (tylko w trybie deweloperskim): adres #/test-bledu
  if (import.meta.env.DEV && hash === '#/test-bledu') {
    throw new Error('Testowy błąd (sprawdzenie ekranu błędu)')
  }

  if (hash === PRIVACY_HASH) return <PrivacyPage />

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <>
      {session ? <Dashboard /> : <AuthForm />}
      <footer className="pb-6 pt-2 text-center text-xs text-slate-400">
        <a href={PRIVACY_HASH} className="underline-offset-2 hover:underline">
          Polityka prywatności
        </a>
        <span className="mx-2">·</span>
        Wersja z {new Date(__BUILD_TIME__).toLocaleString('pl-PL')}
      </footer>
    </>
  )
}