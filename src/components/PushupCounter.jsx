import { useEffect, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import useCountUp from '../hooks/useCountUp'
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
  const animatedCount = useCountUp(info.count)

  return (
    <section className="pushup-card relative overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8">
      <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-14 right-20 h-36 w-36 rounded-full bg-white/10" />
      <Dumbbell className="animate-float pointer-events-none absolute right-6 top-6 h-20 w-20 text-white/15" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/80">
          <Dumbbell className="h-5 w-5" />
          Wyzwanie: pompki
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
          <span className="text-7xl font-extrabold leading-none tabular-nums drop-shadow sm:text-8xl">
            {animatedCount}
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
                  className={`grow-x h-2 flex-1 rounded-full ${
                    index < info.dayInWeek ? 'bg-white' : 'bg-white/30'
                  }`}
                  style={{ animationDelay: `${300 + index * 70}ms` }}
                />
              ))}
            </div>

            <p className="mt-3 text-sm text-white/90">
              Dzień {info.dayNumber} wyzwania · tydzień {info.week} · dzień{' '}
              {info.dayInWeek} z 7
            </p>

            {increment > 0 && (
              <p className="mt-1 text-sm text-white/80">
                Za {info.nextIn} {dayWord(info.nextIn)} (
                {formatDate(info.nextDate)}) będzie {info.nextCount} dziennie.
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-white/90">
            Wyzwanie startuje za {info.nextIn} {dayWord(info.nextIn)} (
            {formatDate(startDate)}).
          </p>
        )}
      </div>
    </section>
  )
}