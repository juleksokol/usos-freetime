import { Check, Circle } from 'lucide-react'
import { useI18n } from '../../context/I18nContext'
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH, evaluatePassword } from '../../lib/passwordPolicy'

const RULE_KEYS = {
  length: 'password.rule.length',
  lower: 'password.rule.lower',
  upper: 'password.rule.upper',
  digit: 'password.rule.digit',
  symbol: 'password.rule.symbol',
  email: 'password.rule.email',
  common: 'password.rule.common',
  max: 'password.rule.max',
}

/**
 * Lista wymagań hasła z oznaczeniem spełnionych. Stan jest podany tekstem dla czytników
 * ekranu, a nie tylko kolorem.
 */
export default function PasswordChecklist({ password, email, id }) {
  const { t } = useI18n()

  // Wymaganie o maksymalnej długości pokazujemy tylko wtedy, gdy hasło jest za długie
  const rules = evaluatePassword(password, { email }).filter(
    (rule) => rule.id !== 'max' || !rule.ok
  )
  const done = rules.filter((rule) => rule.ok).length

  return (
    <div id={id} className="rounded-lg bg-slate-50 px-3 py-3">
      <p className="text-sm font-medium text-slate-700">{t('password.requirements')}</p>
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
              {t(RULE_KEYS[rule.id], {
                n: rule.id === 'max' ? PASSWORD_MAX_BYTES : PASSWORD_MIN_LENGTH,
              })}
              <span className="sr-only">
                {rule.ok ? t('password.rule.met') : t('password.rule.unmet')}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {t('password.progress', { done, total: rules.length })}
      </p>
    </div>
  )
}