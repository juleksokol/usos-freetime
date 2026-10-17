import { useState } from 'react'
import { useActions } from '../../context/ActionsContext'
import { VISIBILITY_OPTIONS } from '../../lib/visibility'
import { Row, selectClass } from './controls'

// Lista przedmiotów z własną widocznością dla znajomych (reguły ustawiane z okna zajęć)
export function VisibilityRules() {
  const { rules, setSubjectVisibility } = useActions()
  const [error, setError] = useState('')

  const entries = Object.entries(rules ?? {}).sort(([a], [b]) =>
    a.localeCompare(b, 'pl')
  )

  const change = async (subject, value) => {
    setError('')
    try {
      await setSubjectVisibility?.(subject, value)
    } catch (err) {
      setError(`Nie udało się zapisać: ${err.message}`)
    }
  }

  return (
    <div className="py-3">
      <p className="text-sm font-medium text-slate-800">
        Przedmioty z własną widocznością
      </p>
      <p className="mt-0.5 text-sm text-slate-500">
        Regułę ustawisz, klikając swoje zajęcia na planie i wybierając „Wszystkie
        zajęcia”. Ukryte zajęcia nie są widoczne dla znajomych, więc w tym czasie
        wyglądasz na wolnego.
      </p>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Brak reguł.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {entries.map(([subject, visibility]) => (
            <li key={subject} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1 basis-40 break-words text-sm text-slate-800">
                {subject}
              </span>
              <select
                value={visibility}
                onChange={(e) => change(subject, e.target.value)}
                className={selectClass}
                aria-label={`Widoczność: ${subject}`}
              >
                {VISIBILITY_OPTIONS.filter((option) => option.value !== 'default').map(
                  (option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )
                )}
              </select>
              <button
                type="button"
                onClick={() => change(subject, 'default')}
                className="text-sm text-slate-500 transition hover:text-slate-800"
              >
                Usuń regułę
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

// Ponowne uruchomienie kreatora pierwszego uruchomienia
export function WizardRow() {
  const { openWizard } = useActions()

  return (
    <Row
      label="Kreator pierwszego uruchomienia"
      hint="Import planu, dołączenie do grupy i powiadomienia krok po kroku."
    >
      <button
        type="button"
        onClick={() => openWizard?.()}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        Uruchom
      </button>
    </Row>
  )
}