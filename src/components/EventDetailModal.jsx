import { useEffect } from 'react'
import {
  CalendarDays,
  Clock,
  GraduationCap,
  Lock,
  MapPin,
  Repeat,
  Tag,
  X,
} from 'lucide-react'
import { DAY_NAMES } from '../lib/constants'
import { formatDate, formatLongDate } from '../lib/dateUtils'
import { timeToMinutes } from '../lib/timeUtils'

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
      <span>{children}</span>
    </li>
  )
}

/**
 * detail: { event, color, ownerName, date }
 */
export default function EventDetailModal({ detail, onClose }) {
  const { event, color, ownerName, date } = detail

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const minutes = timeToMinutes(event.end_time) - timeToMinutes(event.start_time)
  const isCustom = event.source === 'custom'
  const recurrence = recurrenceText(event)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ backgroundColor: `${color}26`, borderTop: `6px solid ${color}` }}>
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

          {event.event_type && <Detail icon={Tag}>{event.event_type}</Detail>}

          {event.teacher && (
            <Detail icon={GraduationCap}>{event.teacher}</Detail>
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
      </div>
    </div>
  )
}