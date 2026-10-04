import { useState } from 'react'
import {
  ALL_DAYS,
  DAY_NAMES,
  DENSITY_HOUR_HEIGHT,
  WORKDAYS,
} from '../lib/constants'
import { useSettings } from '../context/SettingsContext'
import { addDays, formatDayMonth } from '../lib/dateUtils'
import { minutesToTime, timeToMinutes } from '../lib/timeUtils'
import EventDetailModal from './EventDetailModal'

/**
 * layers:     [{ id, name, color, watermark?, events: [...] }]
 *             watermark = tekst (np. pseudonim) wyświetlany jako znak wodny na zajęciach
 * highlights: [{ day, startMin, endMin }]  (opcjonalnie, np. wspólne okienka)
 * weekStart:  "RRRR-MM-DD" poniedziałku (opcjonalnie, pokazuje daty w nagłówku)
 *
 * Kliknięcie kafelka otwiera okno ze wszystkimi informacjami.
 */
export default function WeekGrid({ layers, highlights = [], weekStart }) {
  const { settings } = useSettings()
  const [selected, setSelected] = useState(null)

  const startHour = settings.gridStartHour
  const endHour = settings.gridEndHour
  const hourHeight =
    DENSITY_HOUR_HEIGHT[settings.density] ?? DENSITY_HOUR_HEIGHT.normal
  const days = settings.showWeekend ? ALL_DAYS : WORKDAYS

  const startMin = startHour * 60
  const endMin = endHour * 60
  const totalHeight = (endHour - startHour) * hourHeight
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i
  )
  const toPx = (minutes) => ((minutes - startMin) / 60) * hourHeight
  const gridColumns = {
    gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))`,
  }
  const laneCount = Math.max(layers.length, 1)

  const labelOffsetClass = (hour) => {
    if (hour === startHour) return ''
    if (hour === endHour) return '-translate-y-full'
    return '-translate-y-1/2'
  }

  const blocksByDay = {}
  days.forEach((day) => {
    blocksByDay[day] = []
  })
  let hiddenCount = 0
  let hasCustom = false

  layers.forEach((layer, laneIndex) => {
    layer.events.forEach((event) => {
      const rawStart = timeToMinutes(event.start_time)
      const rawEnd = timeToMinutes(event.end_time)
      const start = Math.max(rawStart, startMin)
      const end = Math.min(rawEnd, endMin)

      if (!blocksByDay[event.day_of_week] || end <= start) {
        hiddenCount++
        return
      }

      const isCustom = event.source === 'custom' && settings.highlightCustom
      if (isCustom) hasCustom = true

      blocksByDay[event.day_of_week].push({
        key: `${layer.id}-${event.id ?? `${event.day_of_week}-${rawStart}-${event.title}`}`,
        event,
        color: layer.color,
        ownerName: layer.name,
        watermark: settings.showWatermark ? (layer.watermark ?? null) : null,
        laneIndex,
        start,
        end,
        isCustom,
      })
    })
  })

  const openDetail = (block) => {
    const { event } = block
    setSelected({
      event,
      color: block.color,
      ownerName: block.ownerName,
      date: weekStart
        ? addDays(weekStart, event.day_of_week - 1)
        : (event.event_date ?? null),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {settings.showLegend && layers.length > 1 && (
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
        <div style={{ minWidth: `${days.length * 118 + 48}px` }}>
          {/* Nagłówek z dniami */}
          <div
            className="grid border-b border-slate-200 bg-slate-50"
            style={gridColumns}
          >
            <div />
            {days.map((day) => (
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
          <div className="grid" style={gridColumns}>
            {/* Kolumna z godzinami */}
            <div className="relative" style={{ height: totalHeight }}>
              {hours.map((hour) => (
                <span
                  key={hour}
                  className={`absolute right-1 text-xs text-slate-400 ${labelOffsetClass(hour)}`}
                  style={{ top: (hour - startHour) * hourHeight }}
                >
                  {hour}:00
                </span>
              ))}
            </div>

            {/* Kolumny dni */}
            {days.map((day) => (
              <div
                key={day}
                className="relative border-l border-slate-200"
                style={{ height: totalHeight }}
              >
                {/* Linie godzin */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-slate-100"
                    style={{ top: (hour - startHour) * hourHeight }}
                  />
                ))}

                {/* Podświetlone przedziały (wspólne okienka) */}
                {highlights
                  .filter((slot) => slot.day === day)
                  .map((slot) => {
                    const start = Math.max(slot.startMin, startMin)
                    const end = Math.min(slot.endMin, endMin)
                    if (end <= start) return null
                    const height = toPx(end) - toPx(start)

                    return (
                      <div
                        key={`${slot.day}-${slot.startMin}-${slot.endMin}`}
                        className="pointer-events-none absolute inset-x-0 z-0 border-y border-dashed border-green-500 bg-green-300/30"
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

                {/* Zajęcia (klikalne kafelki) */}
                {blocksByDay[day].map((block) => {
                  const height = Math.max(toPx(block.end) - toPx(block.start), 18)
                  const { event } = block

                  // Znak wodny pomijamy na bardzo krótkich blokach, żeby nie zasłaniał nazwy
                  const hasWatermark = Boolean(block.watermark) && height >= 32
                  const showTime =
                    settings.tileShowTime && height >= (hasWatermark ? 46 : 40)
                  const showLocation =
                    settings.tileShowLocation &&
                    Boolean(event.location) &&
                    height >= (hasWatermark ? 66 : 54)

                  const style = {
                    top: toPx(block.start),
                    height,
                    left: `calc(${(block.laneIndex * 100) / laneCount}% + 1px)`,
                    width: `calc(${100 / laneCount}% - 2px)`,
                    backgroundColor: `${block.color}26`,
                    borderLeft: `4px solid ${block.color}`,
                  }

                  // Własne wydarzenia: przerywana ramka i delikatny ukośny wzór
                  if (block.isCustom) {
                    style.borderTop = `1px dashed ${block.color}`
                    style.borderRight = `1px dashed ${block.color}`
                    style.borderBottom = `1px dashed ${block.color}`
                    style.backgroundImage = `repeating-linear-gradient(135deg, transparent 0px, transparent 5px, ${block.color}24 5px, ${block.color}24 10px)`
                  }

                  return (
                    <button
                      type="button"
                      key={block.key}
                      onClick={() => openDetail(block)}
                      className="absolute z-10 cursor-pointer overflow-hidden rounded-md px-1 py-0.5 text-left text-[11px] leading-tight text-slate-800 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      style={style}
                      title={[
                        block.watermark ? `Osoba: ${block.ownerName}` : null,
                        event.title,
                        `${event.start_time.slice(0, 5)}–${event.end_time.slice(0, 5)}`,
                        event.location,
                        event.event_type,
                        event.teacher,
                      ]
                        .filter(Boolean)
                        .join('\n')}
                    >
                      <span className="block truncate font-semibold">
                        {event.title}
                      </span>
                      {showTime && (
                        <span className="block truncate text-slate-600">
                          {event.start_time.slice(0, 5)}–
                          {event.end_time.slice(0, 5)}
                        </span>
                      )}
                      {showLocation && (
                        <span className="block truncate text-slate-500">
                          {event.location}
                        </span>
                      )}

                      {hasWatermark && (
                        <span
                          className="pointer-events-none absolute bottom-0.5 right-1 max-w-[85%] truncate text-[9px] font-bold uppercase tracking-wide opacity-50"
                          style={{ color: block.color }}
                        >
                          {block.watermark}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasCustom && (
        <p className="text-xs text-slate-500">
          Przerywana ramka z ukośnym wzorem oznacza własne wydarzenie (nie
          zajęcia z planu). Kliknij kafelek, aby zobaczyć szczegóły.
        </p>
      )}

      {hiddenCount > 0 && (
        <p className="text-xs text-slate-500">
          Nie pokazano {hiddenCount} zajęć (poza dniami lub godzinami siatki:{' '}
          {startHour}:00–{endHour}:00).
        </p>
      )}

      {selected && (
        <EventDetailModal detail={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}