import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { DAY_NAMES } from '../lib/constants'
import { findConflicts, groupConflicts } from '../lib/conflicts'
import { formatDate, formatLongDate, weekdayOf } from '../lib/dateUtils'
import { createCustomEvent } from '../lib/scheduleService'

/**
 * initial: { date, start, end } (z przeciągnięcia po siatce)
 * events:  Twoje zajęcia (do sprawdzenia kolizji)
 */
export default function QuickEventDialog({ initial, events, onClose, onSaved }) {
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [weekly, setWeekly] = useState(false)
  const [until, setUntil] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const day = weekdayOf(initial.date)

  const fields =
    start && end && end > start
      ? {
          title: title.trim() || 'Wydarzenie',
          start_time: start,
          end_time: end,
          location: location.trim() || null,
          teacher: null,
          event_type: 'Własne',
          event_date: weekly ? null : initial.date,
          valid_from: weekly ? initial.date : null,
          valid_until: weekly && until ? until : null,
          day_of_week: day,
        }
      : null

  const conflictGroups = fields ? groupConflicts(findConflicts(fields, events)) : []
  const hasConflicts = conflictGroups.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) return setError('Podaj nazwę wydarzenia.')
    if (!fields) return setError('Godzina zakończenia musi być późniejsza niż rozpoczęcia.')
    if (weekly && until && until < initial.date) {
      return setError('Data „do” nie może być wcześniejsza niż data wydarzenia.')
    }

    setSaving(true)
    setError('')

    try {
      await createCustomEvent(user.id, fields)
      await onSaved()
    } catch (err) {
      setError(`Nie udało się zapisać wydarzenia: ${err.message}`)
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
  const labelClass = 'flex flex-col gap-1 text-sm text-slate-600'

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nowe wydarzenie"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="modal-card max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-t-[6px] border-indigo-600 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Nowe wydarzenie</h3>
            <p className="text-sm text-slate-500">{formatLongDate(initial.date)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-5">
          <label className={labelClass}>
            Nazwa
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Praca, trening, spotkanie koła"
              maxLength={80}
              className={inputClass}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Od godziny
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Do godziny
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Miejsce (opcjonalnie)
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={60}
              className={inputClass}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={weekly}
              onChange={(e) => setWeekly(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            Powtarzaj co tydzień ({DAY_NAMES[day].toLowerCase()})
          </label>

          {weekly && (
            <label className={labelClass}>
              Do dnia (opcjonalnie)
              <input
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className={inputClass}
              />
            </label>
          )}

          {hasConflicts && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Kolizja z Twoim planem ({conflictGroups.length}):
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {conflictGroups.slice(0, 4).map((group) => (
                  <li key={`${group.event.title}-${group.event.start_time}-${group.event.day_of_week}`}>
                    {group.event.title} ({group.event.start_time.slice(0, 5)}–
                    {group.event.end_time.slice(0, 5)}),{' '}
                    {group.dates.length === 1
                      ? formatDate(group.dates[0])
                      : `${group.dates.length} terminów, od ${formatDate(group.dates[0])}`}
                  </li>
                ))}
                {conflictGroups.length > 4 && (
                  <li>…i {conflictGroups.length - 4} więcej</li>
                )}
              </ul>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                hasConflicts
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {hasConflicts ? 'Dodaj mimo kolizji' : 'Dodaj'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Anuluj
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}