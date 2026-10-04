import { useEffect, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { formatDate, todayISO } from '../lib/dateUtils'
import { computePushups } from '../lib/pushups'
import { DEFAULT_SETTINGS } from '../lib/settingsDefaults'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const dayWord = (n) => (n === 1 ? 'dzień' : 'dni')

export default function PushupCounter() {
  const { settings } = useSettings()
  const [today, setToday] = useState(todayISO)

  // Odświeżanie po północy
  useEffect(() => {
    const timer = setInterval(() => setToday(todayISO()), 60000)
    return () => clearInterval(timer)
  }, [])

  const startDate = ISO_DATE.test(settings.pushupsStartDate)
    ? settings.pushupsStartDate
    : DEFAULT_SETTINGS.pushupsStartDate
  const startCount = Number(settings.pushupsStartCount) || 0
  const increment = Number(settings.pushupsWeeklyIncrement) || 0

  const info = computePushups({ startDate, startCount, increment }, today)

  return (
    <section className="overflow-hidden rounded-2xl bg-indigo-600 p-6 text-white shadow-lg sm:p-8">
      <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/80">
        <Dumbbell className="h-5 w-5" />
        Wyzwanie: pompki
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
        <span className="text-7xl font-extrabold leading-none tabular-nums sm:text-8xl">
          {info.count}
        </span>
        <span className="pb-2 text-xl font-semibold text-white/90 sm:text-2xl">
          pompek dziennie
        </span>
      </div>

      {info.started ? (
        <>
          <div className="mt-5 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index < info.dayInWeek ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <p className="mt-3 text-sm text-white/90">
            Dzień {info.dayNumber} wyzwania · tydzień {info.week} · dzień{' '}
            {info.dayInWeek} z 7
          </p>

          {increment > 0 && (
            <p className="mt-1 text-sm text-white/80">
              Za {info.nextIn} {dayWord(info.nextIn)} ({formatDate(info.nextDate)})
              będzie {info.nextCount} dziennie.
            </p>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-white/90">
          Wyzwanie startuje za {info.nextIn} {dayWord(info.nextIn)} (
          {formatDate(startDate)}).
        </p>
      )}
    </section>
  )
}