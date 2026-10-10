import { Bell } from 'lucide-react'
import { addDays, todayISO } from '../lib/dateUtils'
import {
  countdownLabel,
  daysUntil,
  shortMonth,
  sortTests,
  testDisplayName,
  testKind,
} from '../lib/tests'

// Sprawdziany z najbliższych 14 dni (karta na stronie "Dziś"); bez nich nic nie pokazujemy
export default function UpcomingTests({ tests, onOpen }) {
  const today = todayISO()
  const until = addDays(today, 14)

  const list = tests
    .filter((test) => test.test_date >= today && test.test_date <= until)
    .sort(sortTests)

  if (list.length === 0) return null

  return (
    <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
        <Bell className="h-5 w-5 text-indigo-600" />
        Nadchodzące sprawdziany
      </h3>

      <ul className="mt-3 flex flex-col gap-2">
        {list.map((test) => {
          const kind = testKind(test)
          const days = daysUntil(test.test_date)
          const urgent = days <= 1

          return (
            <li key={test.id}>
              <button
                type="button"
                onClick={() => onOpen(test)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
              >
                <span
                  className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-bold leading-tight"
                  style={{ backgroundColor: `${kind.color}22`, color: kind.color }}
                >
                  {Number(test.test_date.split('-')[2])}
                  <span className="text-[9px] uppercase">
                    {shortMonth(test.test_date)}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {test.subject}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {testDisplayName(test)} · {test.start_time.slice(0, 5)}–
                    {test.end_time.slice(0, 5)}
                    {test.location ? ` · ${test.location}` : ''}
                  </span>
                </span>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    urgent ? 'animate-pulse' : ''
                  }`}
                  style={
                    urgent
                      ? { backgroundColor: kind.color, color: '#fff' }
                      : { backgroundColor: `${kind.color}22`, color: kind.color }
                  }
                >
                  {countdownLabel(days)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}