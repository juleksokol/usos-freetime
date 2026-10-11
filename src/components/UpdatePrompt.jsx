import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// Baner "Dostępna nowa wersja": nowa wersja czeka, aż klikniesz "Odśwież"
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return

      // Sprawdzamy nową wersję co godzinę i po powrocie do karty
      setInterval(() => registration.update(), 60 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update()
      })
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="modal-card fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200"
    >
      <RefreshCw className="h-5 w-5 shrink-0 text-indigo-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">
          Dostępna nowa wersja aplikacji
        </p>
        <p className="text-xs text-slate-500">Odśwież, aby zobaczyć zmiany.</p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Odśwież
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
        aria-label="Później"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}