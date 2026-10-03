import {
  DAY_NAMES,
  GRID_END_HOUR,
  GRID_START_HOUR,
  HOUR_HEIGHT,
  WORKDAYS,
} from '../lib/constants'
import { addDays, formatDayMonth } from '../lib/dateUtils'
import { minutesToTime, timeToMinutes } from '../lib/timeUtils'

const START_MIN = GRID_START_HOUR * 60
const END_MIN = GRID_END_HOUR * 60
const TOTAL_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT
const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR + 1 },
  (_, i) => GRID_START_HOUR + i
)

const toPx = (minutes) => ((minutes - START_MIN) / 60) * HOUR_HEIGHT

function labelOffsetClass(hour) {
  if (hour === GRID_START_HOUR) return ''
  if (hour === GRID_END_HOUR) return '-translate-y-full'
  return '-translate-y-1/2'
}

/**
 * layers:     [{ id, name, color, events: [...] }]
 * highlights: [{ day, startMin, endMin }]  (opcjonalnie, np. wspólne okienka)
 * weekStart:  "RRRR-MM-DD" poniedziałku (opcjonalnie, pokazuje daty w nagłówku)
 */
export default function WeekGrid({ layers, highlights = [], weekStart }) {
  const laneCount = Math.max(layers.length, 1)

  const blocksByDay = {}
  WORKDAYS.forEach((day) => {
    blocksByDay[day] = []
  })
  let hiddenCount = 0

  layers.forEach((layer, laneIndex) => {
    layer.events.forEach((event) => {
      const rawStart = timeToMinutes(event.start_time)
      const rawEnd = timeToMinutes(event.end_time)
      const start = Math.max(rawStart, START_MIN)
      const end = Math.min(rawEnd, END_MIN)

      if (!blocksByDay[event.day_of_week] || end <= start) {
        hiddenCount++
        return
      }

      blocksByDay[event.day_of_week].push({
        key: `${layer.id}-${event.id ?? `${event.day_of_week}-${rawStart}-${event.title}`}`,
        event,
        color: layer.color,
        laneIndex,
        start,
        end,
      })
    })
  })

  return (
    <div className="flex flex-col gap-3">
      {layers.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {layers.map((layer) => (
            <span
              key={layer.id}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: layer.color }}
              />
              {layer.name}
            </span>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[640px]">
          {/* Nagłówek z dniami */}
          <div className="grid grid-cols-[3rem_repeat(5,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
            <div />
            {WORKDAYS.map((day) => (
              <div
                key={day}
                className="border-l border-slate-200 py-2 text-center"
              >
                <div className="text-sm font-semibold text-slate-600">
                  {DAY_NAMES[day]}
                </div>
                {weekStart && (
                  <div className="text-xs text-slate-400">
                    {formatDayMonth(addDays(weekStart, day - 1))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Siatka */}
          <div className="grid grid-cols-[3rem_repeat(5,minmax(0,1fr))]">
            {/* Kolumna z godzinami */}
            <div className="relative" style={{ height: TOTAL_HEIGHT }}>
              {HOURS.map((hour) => (
                <span
                  key={hour}
                  className={`absolute right-1 text-xs text-slate-400 ${labelOffsetClass(hour)}`}
                  style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT }}
                >
                  {hour}:00
                </span>
              ))}
            </div>

            {/* Kolumny dni */}
            {WORKDAYS.map((day) => (
              <div
                key={day}
                className="relative border-l border-slate-200"
                style={{ height: TOTAL_HEIGHT }}
              >
                {/* Linie godzin */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-slate-100"
                    style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Podświetlone przedziały (wspólne okienka) */}
                {highlights
                  .filter((slot) => slot.day === day)
                  .map((slot) => {
                    const start = Math.max(slot.startMin, START_MIN)
                    const end = Math.min(slot.endMin, END_MIN)
                    if (end <= start) return null
                    const height = toPx(end) - toPx(start)

                    return (
                      <div
                        key={`${slot.day}-${slot.startMin}-${slot.endMin}`}
                        className="absolute inset-x-0 z-0 border-y border-dashed border-green-500 bg-green-300/30"
                        style={{ top: toPx(start), height }}
                      >
                        {height >= 28 && (
                          <span className="block px-1 pt-0.5 text-[10px] font-medium text-green-800">
                            {minutesToTime(start)}–{minutesToTime(end)}
                          </span>
                        )}
                      </div>
                    )
                  })}

                {/* Zajęcia */}
                {blocksByDay[day].map((block) => {
                  const height = Math.max(toPx(block.end) - toPx(block.start), 18)
                  const { event } = block

                  return (
                    <div
                      key={block.key}
                      className="absolute z-10 overflow-hidden rounded-md border-l-4 px-1 py-0.5 text-[11px] leading-tight text-slate-800"
                      style={{
                        top: toPx(block.start),
                        height,
                        left: `calc(${(block.laneIndex * 100) / laneCount}% + 1px)`,
                        width: `calc(${100 / laneCount}% - 2px)`,
                        backgroundColor: `${block.color}26`,
                        borderLeftColor: block.color,
                      }}
                      title={[
                        event.title,
                        `${event.start_time.slice(0, 5)}–${event.end_time.slice(0, 5)}`,
                        event.location,
                        event.event_type,
                        event.teacher,
                      ]
                        .filter(Boolean)
                        .join('\n')}
                    >
                      <div className="truncate font-semibold">{event.title}</div>
                      {height >= 40 && (
                        <div className="truncate text-slate-600">
                          {event.start_time.slice(0, 5)}–
                          {event.end_time.slice(0, 5)}
                        </div>
                      )}
                      {height >= 54 && event.location && (
                        <div className="truncate text-slate-500">
                          {event.location}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hiddenCount > 0 && (
        <p className="text-xs text-slate-500">
          Nie pokazano {hiddenCount} zajęć (weekend lub poza godzinami{' '}
          {GRID_START_HOUR}:00–{GRID_END_HOUR}:00).
        </p>
      )}
    </div>
  )
}