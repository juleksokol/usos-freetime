import { useMemo, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { getPalette } from '../lib/constants'
import { defaultWeekStart, eventsForWeek } from '../lib/dateUtils'
import WeekGrid from './WeekGrid'
import WeekNav from './WeekNav'

/**
 * Czysty plan tygodnia do wyboru zajęć: każdy kafelek ma plus.
 * onPick({ event, date }) otwiera okno dodawania dla wybranego przedmiotu.
 */
export default function TestPicker({ events, onPick, onManual, onBack }) {
  const { settings } = useSettings()
  const [weekStart, setWeekStart] = useState(defaultWeekStart)

  const layers = useMemo(
    () => [
      {
        id: 'picker',
        name: 'Zajęcia',
        color: getPalette(settings.personPalette)[0],
        events: eventsForWeek(
          events.filter((event) => event.source !== 'custom'),
          weekStart
        ),
      },
    ],
    [events, weekStart, settings.personPalette]
  )

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Wróć
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              Wybierz zajęcia
            </h2>
          </div>

          <WeekNav weekStart={weekStart} onChange={setWeekStart} />
        </div>

        <div className="mt-4">
          <WeekGrid
            layers={layers}
            weekStart={weekStart}
            mode="picker"
            onPick={onPick}
          />
        </div>

        <button
          onClick={onManual}
          className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50"
        >
          <Plus className="h-4 w-4" />
          Dodaj bez wybierania zajęć (np. egzamin w dniu bez zajęć)
        </button>
      </section>
    </div>
  )
}