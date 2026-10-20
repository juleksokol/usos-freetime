import { Component } from 'react'
import { currentTranslator } from '../lib/i18n'
import { reportError } from '../lib/monitoring'

// Wyrejestrowuje service workery i czyści pamięć podręczną plików aplikacji.
// Zostajesz zalogowany, a ustawienia i plan zapisany na koncie nie są ruszane.
async function clearAppCaches() {
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations()
    await Promise.all((registrations ?? []).map((item) => item.unregister()))
  } catch {
    // pomijamy
  }

  try {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  } catch {
    // pomijamy
  }

  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('freetime:cache:'))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // pomijamy
  }
}

export default class ErrorBoundary extends Component {
  state = { error: null, copied: false, clearing: false }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    reportError(error, { componentStack: info?.componentStack })
  }

  details() {
    const { error } = this.state
    return [
      `Błąd: ${error?.message ?? 'nieznany'}`,
      `Czas: ${new Date().toISOString()}`,
      `Adres: ${window.location.href}`,
      `Przeglądarka: ${navigator.userAgent}`,
      '',
      String(error?.stack ?? '').slice(0, 1500),
    ].join('\n')
  }

  copy = async () => {
    try {
      await navigator.clipboard.writeText(this.details())
      this.setState({ copied: true })
    } catch {
      this.setState({ copied: false })
    }
  }

  clearAndReload = async () => {
    this.setState({ clearing: true })
    await clearAppCaches()
    window.location.reload()
  }

    render() {
    const { error, copied, clearing } = this.state
    if (!error) return this.props.children

    // Ekran błędu działa poza dostawcami, więc język odczytujemy bezpośrednio
    const t = currentTranslator()

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <h1 className="text-xl font-bold text-slate-800">{t('error.title')}</h1>
          <p className="mt-2 text-sm text-slate-600">{t('error.body')}</p>

          <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
            {error.message}
          </pre>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {t('error.refresh')}
            </button>
            <button
              onClick={this.clearAndReload}
              disabled={clearing}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {clearing ? t('error.clearing') : t('error.clearCache')}
            </button>
            <button
              onClick={this.copy}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              {copied ? t('error.copied') : t('error.copy')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}
