import { useEffect, useState } from 'react'
import { Bell, Loader2, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { TEST_KIND_ORDER, TEST_KINDS } from '../lib/tests'
import { createTest, deleteTest, updateTest } from '../lib/testService'

const CUSTOM = '__custom'

/**
 * initial:  szkic formularza (patrz blankTest / draftFromTile / testToDraft w lib/tests.js)
 * subjects: lista przedmiotów do wyboru
 * onSaved:  wywoływane po zapisaniu lub usunięciu (rodzic odświeża dane i zamyka okno)
 */
export default function TestDialog({ initial, subjects, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = Boolean(initial.id)

  const [form, setForm] = useState(initial)
  const [customSubject, setCustomSubject] = useState(
    () => Boolean(initial.subject) && !subjects.includes(initial.subject)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const kind = TEST_KINDS[form.kind]
  const set = (field) => (e) =>
    setForm((previous) => ({ ...previous, [field]: e.target.value }))

  const handleSubjectChange = (e) => {
    const value = e.target.value
    if (value === CUSTOM) {
      setCustomSubject(true)
      setForm((previous) => ({ ...previous, subject: '' }))
    } else {
      setCustomSubject(false)
      setForm((previous) => ({ ...previous, subject: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const subject = form.subject.trim()
    if (!subject) return setError('Wybierz przedmiot albo wpisz jego nazwę.')
    if (!form.date) return setError('Wybierz datę.')
    if (!form.start || !form.end) {
      return setError('Podaj godzinę rozpoczęcia i zakończenia.')
    }
    if (form.end <= form.start) {
      return setError('Godzina zakończenia musi być późniejsza niż rozpoczęcia.')
    }

    const fields = {
      kind: form.kind,
      subject,
      title: form.title.trim() || null,
      test_date: form.date,
      start_time: form.start,
      end_time: form.end,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      result: form.result.trim() || null,
      reminder: form.reminder,
    }

    setSaving(true)
    setError('')

    try {
      if (isEdit) {
        await updateTest(initial.id, fields)
      } else {
        await createTest(user.id, fields)
      }
      await onSaved()
    } catch (err) {
      setError(`Nie udało się zapisać: ${err.message}`)
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Usunąć ten sprawdzian?')) return

    setSaving(true)
    try {
      await deleteTest(initial.id)
      await onSaved()
    } catch (err) {
      setError(`Nie udało się usunąć: ${err.message}`)
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
      aria-label={isEdit ? 'Edytuj sprawdzian' : 'Nowy sprawdzian'}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="modal-card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            backgroundColor: `${kind.color}22`,
            borderTop: `6px solid ${kind.color}`,
          }}
        >
          <h3 className="text-lg font-bold text-slate-900">
            {isEdit ? 'Edytuj sprawdzian' : 'Nowy sprawdzian'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-black/10 hover:text-slate-800"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="grid grid-cols-3 gap-2">
            {TEST_KIND_ORDER.map((id) => {
              const option = TEST_KINDS[id]
              const active = form.kind === id

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm((previous) => ({ ...previous, kind: id }))}
                  className="rounded-lg border-2 px-2 py-2 text-sm font-semibold transition"
                  style={
                    active
                      ? { backgroundColor: option.color, borderColor: option.color, color: '#fff' }
                      : { borderColor: `${option.color}66`, color: option.color }
                  }
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <label className={labelClass}>
            Przedmiot
            <select
              value={customSubject ? CUSTOM : form.subject}
              onChange={handleSubjectChange}
              className={inputClass}
            >
              <option value="">Wybierz przedmiot…</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
              <option value={CUSTOM}>Inny (wpisz ręcznie)…</option>
            </select>
          </label>

          {customSubject && (
            <input
              type="text"
              value={form.subject}
              onChange={set('subject')}
              placeholder="Nazwa przedmiotu"
              maxLength={120}
              className={inputClass}
              autoFocus
            />
          )}

          <label className={labelClass}>
            Nazwa (opcjonalnie)
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="np. Kolokwium 1, Egzamin poprawkowy"
              maxLength={80}
              className={inputClass}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              Data
              <input
                type="date"
                value={form.date}
                onChange={set('date')}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Od godziny
              <input
                type="time"
                value={form.start}
                onChange={set('start')}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Do godziny
              <input
                type="time"
                value={form.end}
                onChange={set('end')}
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Miejsce (opcjonalnie)
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              maxLength={60}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Zakres materiału / notatki
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={4}
              maxLength={2000}
              placeholder="Z czego będzie sprawdzian: tematy, rozdziały, wzory do zapamiętania…"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Wynik / ocena (opcjonalnie)
            <input
              type="text"
              value={form.result}
              onChange={set('result')}
              placeholder="np. 4.5 albo 18/20 pkt"
              maxLength={40}
              className={inputClass}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.reminder}
              onChange={(e) =>
                setForm((previous) => ({ ...previous, reminder: e.target.checked }))
              }
              className="h-4 w-4 accent-indigo-600"
            />
            <Bell className="h-4 w-4 text-slate-500" />
            Przypomnij mi dzień przed
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Zapisz zmiany' : 'Dodaj'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Anuluj
            </button>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Usuń
            </button>
          )}
        </div>
      </form>
    </div>
  )
}