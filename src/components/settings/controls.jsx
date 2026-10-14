import { ChevronDown } from 'lucide-react'
import './settings.css'

export const selectClass =
  'max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

/**
 * Zwijana sekcja ustawień.
 * summary: krótkie podsumowanie widoczne w nagłówku (np. "Ciemny · Indygo")
 */
export function Section({ title, description, icon: Icon, summary, open, onToggle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:px-6"
      >
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-800">{title}</span>
          {description && (
            <span className="block text-sm text-slate-500">{description}</span>
          )}
        </span>

        {summary && (
          <span className="hidden max-w-[40%] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 sm:block">
            {summary}
          </span>
        )}

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div className="settings-collapse" data-open={open}>
        <div className="settings-collapse-inner">
          <div className="flex flex-col divide-y divide-slate-100 border-t border-slate-100 px-4 pb-2 sm:px-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

// Mały nagłówek wewnątrz sekcji
export function SubHeading({ children }) {
  return (
    <p className="pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </p>
  )
}

export function Row({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 sm:flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
      <div className="min-w-0 max-w-full sm:shrink-0">{children}</div>
    </div>
  )
}

export function Switch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
        checked ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[1.375rem]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

export function Segmented({ value, options, onChange }) {
  return (
    <div className="flex max-w-full flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
            value === option.value
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}