/* global __BUILD_TIME__ */
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { useI18n } from './context/I18nContext'
import AccessibilityPage from './components/AccessibilityPage'
import AuthForm from './components/AuthForm'
import PrivacyPage from './components/PrivacyPage'
import ForcePasswordChange from './components/password/ForcePasswordChange'
import Dashboard from './pages/Dashboard'

const PRIVACY_HASH = '#/prywatnosc'
const ACCESSIBILITY_HASH = '#/dostepnosc'

export default function App() {
  const { session, loading, recovering, mustChangePassword } = useAuth()
  const { t, locale } = useI18n()
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
  if (hash === ACCESSIBILITY_HASH) return <AccessibilityPage />

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2
          className="h-10 w-10 animate-spin text-indigo-600"
          role="img"
          aria-label={t('app.loading')}
        />
      </div>
    )
  }

  // Bez sesji albo w trakcie resetu hasła: logowanie. Słabe hasło: wymuszona zmiana.
  let content
  if (!session || recovering) content = <AuthForm />
  else if (mustChangePassword) content = <ForcePasswordChange />
  else content = <Dashboard />

  return (
    <>
      {content}
      <footer className="pb-6 pt-2 text-center text-xs text-slate-600">
        <a href={PRIVACY_HASH} className="underline-offset-2 hover:underline">
          {t('footer.privacy')}
        </a>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        <a href={ACCESSIBILITY_HASH} className="underline-offset-2 hover:underline">
          {t('footer.accessibility')}
        </a>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        {t('footer.version', { date: new Date(__BUILD_TIME__).toLocaleString(locale) })}
      </footer>
    </>
  )
}