import { LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import PasswordChangeForm from './PasswordChangeForm'

// Ekran blokujący aplikację, dopóki użytkownik nie ustawi hasła spełniającego wymagania
export default function ForcePasswordChange() {
  const { signOut } = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 h-7 w-7 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Zmień hasło, aby kontynuować</h1>
            <p className="mt-1 text-sm text-slate-600">
              Twoje obecne hasło nie spełnia aktualnych wymagań bezpieczeństwa. Ustaw nowe
              hasło, a potem wrócisz do aplikacji.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <PasswordChangeForm />
        </div>

        <button
          type="button"
          onClick={signOut}
          className="mt-6 flex items-center gap-2 text-sm text-slate-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Wyloguj się
        </button>
      </div>
    </main>
  )
}