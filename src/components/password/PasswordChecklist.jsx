import { Check, Circle } from 'lucide-react'
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH, evaluatePassword } from '../../lib/passwordPolicy'

const LABELS = {
  length: `Co najmniej ${PASSWORD_MIN_LENGTH} znaków`,
  lower: 'Mała litera (a–z)',
  upper: 'Wielka litera (A–Z)',
  digit: 'Cyfra (0–9)',
  symbol: 'Symbol, np. ! @ # $ % & * - _',
  email: 'Hasło nie zawiera Twojego adresu e-mail',
  common: 'To nie jest popularne hasło',
  max: `Co najwyżej ${PASSWORD_MAX_BYTES} znaków`,
}

/**
 * Lista wymagań hasła z oznaczeniem spełnionych. Stan jest podany tekstem dla czytników
 * ekranu, a nie tylko kolorem.
 */
export default function PasswordChecklist({ password, email, id }) {
  // Wymaganie o maksymalnej długości pokazujemy tylko wtedy, gdy hasło jest za długie
  const rules = evaluatePassword(password, { email }).filter(
    (rule) => rule.id !== 'max' || !rule.ok
  )
  const done = rules.filter((rule) => rule.ok).length

  return (
    <div id={id} className="rounded-lg bg-slate-50 px-3 py-3">
      <p className="text-sm font-medium text-slate-700">Wymagania hasła</p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-start gap-2 text-sm ${
              rule.ok ? 'text-green-800' : 'text-slate-700'
            }`}
          >
            {rule.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            )}
            <span>
              {LABELS[rule.id]}
              <span className="sr-only">{rule.ok ? ' (spełnione)' : ' (niespełnione)'}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {`Spełniono ${done} z ${rules.length} wymagań hasła`}
      </p>
    </div>
  )
}