import { useState } from 'react'
import { AlertTriangle, CalendarPlus, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { DAY_NAMES } from '../lib/constants'
import { findConflicts, groupConflicts } from '../lib/conflicts'
import { formatDate, weekdayOf } from '../lib/dateUtils'
import {
  createCustomEvent,
  deleteEvent,
  updateCustomEvent,
} from '../lib/scheduleService'

const EMPTY_FORM = {
  title: '',
  kind: 'once', // 'once' = jednorazowe, 'weekly' = co tydzień
  date: '',
  weekday: '1',
  validFrom: '',
  validUntil: '',
  start: '',
  end: '',
  location: '',
}

function formFromEvent(event) {
  return {
    title: event.title,
    kind: event.event_date ? 'once' : 'weekly',
    date: event.event_date ?? '',
    weekday: String(event.day_of_week),
    validFrom: event.valid_from ?? '',
    validUntil: event.valid_until ?? '',
    start: event.start_time.slice(0, 5),
    end: event.end_time.slice(0, 5),
    location: event.location ?? '',
  }
}

// Zwraca { fields } do zapisu albo { error }
function buildPayload(form) {
  const title = form.title.trim()
  if (!title) return { error: 'Podaj nazwę wydarzenia.' }
  if (!form.start || !form.end) {
    return { error: 'Podaj godzinę rozpoczęcia i zakończenia.' }
  }
  if (form.end <= form.start) {
    return { error: 'Godzina zakończenia musi być późniejsza niż rozpoczęcia.' }
  }

  const base = {
    title,
    start_time: form.start,
    end_time: form.end,
    location: form.location.trim() || null,
    teacher: null,
    event_type: 'Własne',
  }

  if (form.kind === 'once') {
    if (!form.date) return { error: 'Wybierz datę wydarzenia.' }
    return {
      fields: {
        ...base,
        event_date: form.date,
        valid_from: null,
        valid_until: null,
        day_of_week: weekdayOf(form.date),
      },
    }
  }

  if (form.validFrom && form.validUntil && form.validUntil < form.validFrom) {
    return { error: 'Data „do” nie może być wcześniejsza niż „od”.' }
  }

  return {
    fields: {
      ...base,
      event_date: null,
      valid_from: form.validFrom || null,
      valid_until: form.validUntil || null,
      day_of_week: Number(form.weekday),
    },
  }
}

function describe(event) {
  if (event.event_date) return formatDate(event.event_date)

  const range =
    event.valid_from || event.valid_until
      ? ` (${event.valid_from ? formatDate(event.valid_from) : '…'} – ${
          event.valid_until ? formatDate(event.valid_until) : '…'
        })`
      : ''
  return `co tydzień, ${DAY_NAMES[event.day_of_week].toLowerCase()}${range}`
}

export default function CustomEvents({ events, onChanged }) {
  const { user } = useAuth()

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const customEvents = events
    .filter((event) => event.source === 'custom')
    .sort(
      (a, b) =>
        (a.event_date ?? a.valid_from ?? '').localeCompare(
          b.event_date ?? b.valid_from ?? ''
        ) || a.start_time.localeCompare(b.start_time)
    )

  // Kolizje liczone na bieżąco (z zajęciami z planu i innymi własnymi wydarzeniami)
  const payload = buildPayload(form)
  const conflictGroups = payload.fields
    ? groupConflicts(findConflicts(payload.fields, events, editingId))
    : []
  const hasConflicts = conflictGroups.length > 0

  const setField = (field) => (e) =>
    setForm((previous) => ({ ...previous, [field]: e.target.value }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (payload.error) {
      setError(payload.error)
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingId) {
        await updateCustomEvent(editingId, payload.fields)
      } else {
        await createCustomEvent(user.id, payload.fields)
      }
      resetForm()
      await onChanged?.()
    } catch (err) {
      setError(`Nie udało się zapisać wydarzenia: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (event) => {
    setForm(formFromEvent(event))
    setEditingId(event.id)
    setError('')
  }

  const handleDelete = async (event) => {
    if (!window.confirm(`Usunąć wydarzenie „${event.title}”?`)) return

    try {
      await deleteEvent(event.id)
      if (editingId === event.id) resetForm()
      await onChanged?.()
    } catch (err) {
      setError(`Nie udało się usunąć wydarzenia: ${err.message}`)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

  const labelClass = 'flex flex-col gap-1 text-sm text-slate-600'

  return (
    <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        <CalendarPlus className="h-5 w-5 text-indigo-600" />
        Własne wydarzenia
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Praca, trening, spotkania: dodane wpisy blokują czas w planie i we
        wspólnych okienkach (na siatce mają przerywaną ramkę). Zostają po
        ponownym imporcie planu.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <label className={labelClass}>
          Nazwa
          <input
            type="text"
            value={form.title}
            onChange={setField('title')}
            placeholder="np. Praca w sklepie"
            maxLength={80}
            className={inputClass}
          />
        </label>

        <div className="flex gap-4 text-sm text-slate-700">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="once"
              checked={form.kind === 'once'}
              onChange={setField('kind')}
              className="accent-indigo-600"
            />
            Jednorazowe
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="kind"
              value="weekly"
              checked={form.kind === 'weekly'}
              onChange={setField('kind')}
              className="accent-indigo-600"
            />
            Co tydzień
          </label>
        </div>

        {form.kind === 'once' ? (
          <label className={labelClass}>
            Data
            <input
              type="date"
              value={form.date}
              onChange={setField('date')}
              className={inputClass}
            />
          </label>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              Dzień tygodnia
              <select
                value={form.weekday}
                onChange={setField('weekday')}
                className={inputClass}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>
                    {DAY_NAMES[day]}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Od (opcjonalnie)
              <input
                type="date"
                value={form.validFrom}
                onChange={setField('validFrom')}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Do (opcjonalnie)
              <input
                type="date"
                value={form.validUntil}
                onChange={setField('validUntil')}
                className={inputClass}
              />
            </label>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Od godziny
            <input
              type="time"
              value={form.start}
              onChange={setField('start')}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Do godziny
            <input
              type="time"
              value={form.end}
              onChange={setField('end')}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Miejsce (opcjonalnie)
            <input
              type="text"
              value={form.location}
              onChange={setField('location')}
              maxLength={60}
              className={inputClass}
            />
          </label>
        </div>

        {hasConflicts && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Kolizja z Twoim planem ({conflictGroups.length}):
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {conflictGroups.slice(0, 5).map((group) => (
                <li key={`${group.event.title}-${group.event.start_time}-${group.event.day_of_week}`}>
                  {group.event.title} ({DAY_NAMES[group.event.day_of_week]}{' '}
                  {group.event.start_time.slice(0, 5)}–
                  {group.event.end_time.slice(0, 5)}
                  {group.event.source === 'custom' ? ', własne wydarzenie' : ''}
                  ){' '}
                  {group.dates.length === 1
                    ? `, ${formatDate(group.dates[0])}`
                    : `, ${group.dates.length} terminów, od ${formatDate(group.dates[0])}`}
                </li>
              ))}
              {conflictGroups.length > 5 && (
                <li>…i {conflictGroups.length - 5} więcej</li>
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
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              hasConflicts
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {hasConflicts
              ? 'Zapisz mimo kolizji'
              : editingId
                ? 'Zapisz zmiany'
                : 'Dodaj wydarzenie'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
              Anuluj edycję
            </button>
          )}
        </div>
      </form>

      {customEvents.length > 0 && (
        <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
          {customEvents.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-800">
                  {event.title}
                </div>
                <div className="text-xs text-slate-500">
                  {describe(event)} · {event.start_time.slice(0, 5)}–
                  {event.end_time.slice(0, 5)}
                  {event.location ? ` · ${event.location}` : ''}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => handleEdit(event)}
                  className="rounded p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Edytuj wydarzenie"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(event)}
                  className="rounded p-2 text-red-600 transition hover:bg-red-50"
                  aria-label="Usuń wydarzenie"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}