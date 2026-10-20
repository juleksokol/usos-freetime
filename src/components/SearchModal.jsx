import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ClipboardList, GraduationCap, Search, X } from 'lucide-react'
import { DAY_NAMES } from '../lib/constants'
import { formatDate, todayISO, weekdayOf } from '../lib/dateUtils'
import { searchPlan } from '../lib/search'
import { shortMonth, testDisplayName, testKind } from '../lib/tests'

const dayShort = (date) => DAY_NAMES[weekdayOf(date)].slice(0, 3)

/**
 * onGoToDate(date): otwiera "Mój plan" w tygodniu z podaną datą
 * onOpenTest(test): otwiera okno edycji sprawdzianu
 */
export default function SearchModal({ events, tests, onClose, onGoToDate, onOpenTest }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const today = todayISO()

  useEffect(() => {
    inputRef.current?.focus()

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const results = useMemo(
    () => searchPlan(events, tests, query, today),
    [events, tests, query, today]
  )

  const nothingFound =
    results &&
    results.subjects.length === 0 &&
    results.occurrences.length === 0 &&
    results.tests.length === 0

  const headingClass = 'px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400'
  const rowClass =
    'flex w-full items-start gap-3 px-4 py-2 text-left transition hover:bg-slate-50'

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[8vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Wyszukiwarka"
    >
      <div
        className="modal-card flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Szukaj przedmiotu, prowadzącego lub sali"
            placeholder="Szukaj przedmiotu, prowadzącego, sali…"
            className="min-w-0 flex-1 bg-transparent text-base text-slate-800 placeholder-slate-400 outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto pb-3">
          {!results && (
            <p className="px-4 py-6 text-sm text-slate-500">
              Wpisz nazwę przedmiotu, nazwisko prowadzącego albo salę. Wszystkie
              wpisane słowa muszą pasować. Szukam w Twoim planie i
              sprawdzianach.
            </p>
          )}

          {nothingFound && (
            <p className="px-4 py-6 text-sm text-slate-500">Brak wyników.</p>
          )}

          {results && results.subjects.length > 0 && (
            <>
              <h3 className={headingClass}>Przedmioty</h3>
              {results.subjects.map((item) => (
                <button
                  key={item.subject}
                  type="button"
                  disabled={!item.next}
                  onClick={() => item.next && onGoToDate(item.next.date)}
                  className={`${rowClass} disabled:cursor-default disabled:hover:bg-transparent`}
                >
                  <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800">
                      {item.subject}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {[...item.types, ...item.teachers].join(' · ')}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {item.count} terminów
                      {item.next
                        ? `, najbliższy: ${dayShort(item.next.date)} ${formatDate(item.next.date)} ${item.next.event.start_time.slice(0, 5)}`
                        : ', brak nadchodzących'}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}

          {results && results.occurrences.length > 0 && (
            <>
              <h3 className={headingClass}>Najbliższe terminy</h3>
              {results.occurrences.map(({ event, date }) => (
                <button
                  key={`${event.id}-${date}`}
                  type="button"
                  onClick={() => onGoToDate(date)}
                  className={rowClass}
                >
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {event.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {dayShort(date)} {formatDate(date)} ·{' '}
                      {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
                      {event.location ? ` · ${event.location}` : ''}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}

          {results && results.tests.length > 0 && (
            <>
              <h3 className={headingClass}>Sprawdziany</h3>
              {results.tests.map((test) => {
                const kind = testKind(test)

                return (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => onOpenTest(test)}
                    className={rowClass}
                  >
                    <ClipboardList
                      className="mt-0.5 h-5 w-5 shrink-0"
                      style={{ color: kind.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {testDisplayName(test)}: {test.subject}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {Number(test.test_date.split('-')[2])}{' '}
                        {shortMonth(test.test_date)} ·{' '}
                        {test.start_time.slice(0, 5)}–{test.end_time.slice(0, 5)}
                        {test.notes ? ` · ${test.notes}` : ''}
                      </span>
                    </span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}