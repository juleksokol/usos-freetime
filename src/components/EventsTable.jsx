import { DAY_NAMES } from '../lib/constants'
import { formatDate } from '../lib/dateUtils'

function sortDate(event) {
  return event.event_date ?? event.valid_from ?? ''
}

function sortEvents(a, b) {
  return (
    sortDate(a).localeCompare(sortDate(b)) ||
    a.day_of_week - b.day_of_week ||
    a.start_time.localeCompare(b.start_time)
  )
}

function describeDate(event) {
  if (event.event_date) return formatDate(event.event_date)
  if (event.valid_from) {
    return event.valid_until
      ? `co tydzień ${formatDate(event.valid_from)}–${formatDate(event.valid_until)}`
      : `co tydzień od ${formatDate(event.valid_from)}`
  }
  return null
}

export default function EventsTable({ events }) {
  const sorted = [...events].sort(sortEvents)

  return (
    <div className="max-h-96 overflow-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 font-medium">Dzień</th>
            <th className="px-3 py-2 font-medium">Godziny</th>
            <th className="px-3 py-2 font-medium">Przedmiot</th>
            <th className="px-3 py-2 font-medium">Typ</th>
            <th className="px-3 py-2 font-medium">Miejsce</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((event, index) => {
            const dateInfo = describeDate(event)

            return (
              <tr key={event.id ?? index} className="text-slate-700">
                <td className="whitespace-nowrap px-3 py-2">
                  {DAY_NAMES[event.day_of_week]}
                  {dateInfo && (
                    <span className="block text-xs text-slate-400">
                      {dateInfo}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
                </td>
                <td className="px-3 py-2">
                  {event.title}
                  {event.teacher && (
                    <span className="block text-xs text-slate-400">
                      {event.teacher}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{event.event_type ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {event.location ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}