import PasswordChangeForm from '../password/PasswordChangeForm'

// Zawartość sekcji „Hasło” w Ustawieniach
export default function PasswordBody() {
  return (
    <div className="py-4">
      <p className="mb-4 text-sm text-slate-600">
        Zmiana hasła wymaga podania obecnego hasła. Jeśli go nie pamiętasz, wyloguj się i
        użyj opcji „Nie pamiętasz hasła?” na ekranie logowania.
      </p>
      <PasswordChangeForm />
    </div>
  )
}