import { useId, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useI18n } from '../../context/I18nContext'

/**
 * Pole hasła z etykietą i przyciskiem „Pokaż hasło”.
 * describedBy: id elementu z opisem (np. listy wymagań), invalid: błąd w polu
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  describedBy,
  invalid = false,
  required = true,
  autoFocus = false,
}) {
  const { t } = useI18n()
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-500"
          aria-hidden="true"
        />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-12 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t('password.hide') : t('password.show')}
          aria-pressed={visible}
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}