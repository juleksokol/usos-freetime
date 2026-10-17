import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Lock,
  MapPin,
  Pencil,
  Repeat,
  Tag,
  Trophy,
  X,
} from 'lucide-react'
import { useActions } from '../context/ActionsContext'
import { useAuth } from '../context/AuthContext'
import { DAY_NAMES } from '../lib/constants'
import { formatDate, formatLongDate } from '../lib/dateUtils'
import { timeToMinutes } from '../lib/timeUtils'
import {
  VISIBILITY_OPTIONS,
  describeFriendView,
  effectiveVisibility,
  friendView,
} from '../lib/visibility'

function recurrenceText(event) {
  if (event.event_date) return null

  const range =
    event.valid_from || event.valid_until
      ? ` (${event.valid_from ? formatDate(event.valid_from) : '…'} – ${
          event.valid_until ? formatDate(event.valid_until) : '…'
        })`
      : ''

  return `Co tydzień, ${DAY_NAMES[event.day_of_week].toLowerCase()}${range}`
}

function Detail({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-3 text-slate-700">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
      <span className="min-w-0">{children}</span>
    </li>
  )
}

// Widoczność własnych zajęć dla znajomych: ten termin albo wszystkie zajęcia przedmiotu
function VisibilitySection({ event }) {
  const { profile } = useAuth()
  const { rules, setEventVisibility, setSubjectVisibility } = useActions()
  const shareDetails = profile?.share_details ?? true

  const [value, setValue] = useState(() => effectiveVisibility(event, rules))
  const [scope, setScope] = useState('event') // 'event' | 'subject'
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const subjectRule = rules?.[event.title]

  // Co zobaczy znajomy po zapisaniu
  const preview =
    scope === 'event'
      ? friendView({ ...event, visibility: value }, rules, shareDetails)
      : friendView(
          { ...event, visibility: 'default' },
          { ...rules, [event.title]: value === 'default' ? undefined : value },
          shareDetails
        )

  const save = async () => {
    setSaving(true)
    setMessage('')

    try {
      if (scope === 'subject') {
        await setSubjectVisibility(event.title, value)
        if (event.visibility && event.visibility !== 'default') {
          await setEventVisibility(event.id, 'default')
        }
      } else {
        await setEventVisibility(event.id, value)
      }
      setMessage('Zapisano.')
    } catch (err) {
      setMessage(`Nie udało się zapisać: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-slate-100 px-6 py-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Eye className="h-4 w-4 text-slate-400" />
        Widoczność dla znajomych
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {VISIBILITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setValue(option.value)}
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

      <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-700">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name={`visibility-scope-${event.id}`}
            checked={scope === 'event'}
            onChange={() => setScope('event')}
            className="accent-indigo-600"
          />
          Tylko ten termin
        </label>
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="radio"
            name={`visibility-scope-${event.id}`}
            checked={scope === 'subject'}
            onChange={() => setScope('subject')}
            className="mt-1 accent-indigo-600"
          />
          <span className="min-w-0">Wszystkie zajęcia: „{event.title}”</span>
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-500">{describeFriendView(preview)}</p>

      {scope === 'event' && subjectRule && value === 'default' && (
        <p className="mt-1 text-xs text-amber-700">
          Ten przedmiot ma regułę, która nadal obowiązuje (
          {subjectRule === 'hidden' ? 'ukryte' : 'tylko „Zajęty”'}).
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Zapisz widoczność
        </button>
        {message && <span className="text-xs text-slate-500">{message}</span>}
      </div>
    </div>
  )
}

/**
 * detail: { event, color, ownerName, date }
 * onEditTest(testId): opcjonalnie, pokazuje przycisk "Edytuj" dla sprawdzianów
 */
export default function EventDetailModal({ detail, onClose, onEditTest }) {
  const { event, color, ownerName, date } = detail
  const { user } = useAuth()
  const { setEventVisibility } = useActions()

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const minutes = timeToMinutes(event.end_time) - timeToMinutes(event.start_time)
  const isCustom = event.source === 'custom'
  const isTest = event.source === 'test'
  const recurrence = recurrenceText(event)

  // Widoczność ustawiasz tylko dla własnych zajęć i wydarzeń (nie sprawdzianów)
  const canSetVisibility =
    Boolean(setEventVisibility) && !isTest && Boolean(event.user_id) && event.user_id === user?.id

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div
        className="modal-card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-5"
          style={{ backgroundColor: `${color}26`, borderTop: `6px solid ${color}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color }}
              >
                {ownerName}
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                {event.title}
              </h3>

              {isTest && (
                <span
                  className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: color }}
                >
                  {event.event_type}
                </span>
              )}
              {isCustom && (
                <span className="mt-2 inline-block rounded-full border border-dashed border-slate-400 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Własne wydarzenie
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-black/10 hover:text-slate-800"
              aria-label="Zamknij"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-3 px-6 py-5 text-sm">
          {date && (
            <Detail icon={CalendarDays}>
              <span className="font-medium">{formatLongDate(date)}</span>
            </Detail>
          )}

          <Detail icon={Clock}>
            <span className="font-medium">
              {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
            </span>{' '}
            <span className="text-slate-500">({minutes} min)</span>
          </Detail>

          {recurrence && <Detail icon={Repeat}>{recurrence}</Detail>}

          {event.location && <Detail icon={MapPin}>{event.location}</Detail>}

          {event.event_type && !isTest && (
            <Detail icon={Tag}>{event.event_type}</Detail>
          )}

          {event.teacher && (
            <Detail icon={GraduationCap}>{event.teacher}</Detail>
          )}

          {event.notes && (
            <Detail icon={FileText}>
              <span className="whitespace-pre-wrap">{event.notes}</span>
            </Detail>
          )}

          {event.result && (
            <Detail icon={Trophy}>
              Wynik: <span className="font-medium">{event.result}</span>
            </Detail>
          )}

          {event.is_masked && (
            <Detail icon={Lock}>
              <span className="text-slate-500">
                Ta osoba udostępnia znajomym tylko godziny zajęć, bez
                szczegółów.
              </span>
            </Detail>
          )}
        </ul>

        {canSetVisibility && <VisibilitySection event={event} />}

        {isTest && onEditTest && (
          <div className="border-t border-slate-100 px-6 py-4">
            <button
              onClick={() => {
                onClose()
                onEditTest(event.testId)
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Pencil className="h-4 w-4" />
              Edytuj
            </button>
          </div>
        )}
      </div>
    </div>
  )
}