import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  ALL_DAYS,
  DAY_NAMES,
  DENSITY_HOUR_HEIGHT,
  WORKDAYS,
} from '../lib/constants'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useTests } from '../context/TestsContext'
import { addDays, daysBetween, formatDayMonth, todayISO } from '../lib/dateUtils'
import { layoutColumns } from '../lib/layout'
import { weekMarkers } from '../lib/tests'
import { minutesToTime, timeToMinutes } from '../lib/timeUtils'
import EventDetailModal from './EventDetailModal'

const LONG_PRESS_MS = 550
const TOUCH_DRAG_DELAY_MS = 450
const SNAP_MIN = 15

// Zajęcia z planu (nie własne wydarzenia i nie sprawdziany)
const isClass = (event) => event.source !== 'custom' && event.source !== 'test'

function currentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

/**
 * layers:        [{ id, name, color, watermark?, showMarkers?, applySubjectStyles?, events: [...] }]
 * highlights:    [{ day, startMin, endMin }]  (opcjonalnie, np. wspólne okienka)
 * weekStart:     "RRRR-MM-DD" poniedziałku (daty w nagłówku, kropki sprawdzianów, linia "teraz")
 * mode:          'view' (domyślnie) albo 'picker' (kafelki z plusem do wyboru zajęć)
 * onPick:        ({ event, date }) w trybie 'picker'
 * onLongPress:   ({ event, date }) po przytrzymaniu kafelka zajęć
 * onEditTest:    (testId) przycisk "Edytuj" w oknie sprawdzianu
 * onCreateRange: ({ date, startMin, endMin }) po przeciągnięciu po pustym miejscu siatki
 *
 * Zdarzenia mogą mieć pole tileColor (własny kolor kafelka, np. sprawdziany).
 */
export default function WeekGrid({
  layers,
  highlights = [],
  weekStart,
  mode = 'view',
  onPick,
  onLongPress,
  onEditTest,
  onCreateRange,
}) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { tests } = useTests()
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(null) // zaznaczenie przy przeciąganiu: { day, startMin, endMin }
  const [nowMin, setNowMin] = useState(currentMinutes)

  const pressRef = useRef({ timer: null, fired: false, x: 0, y: 0 })
  const dragRef = useRef({
    timer: null,
    active: false,
    moved: false,
    day: null,
    column: null,
    pointerId: null,
    pointerType: 'mouse',
    x: 0,
    y: 0,
    anchor: 0,
    range: null,
  })
  const nowLineRef = useRef(null)
  const scrolledRef = useRef(false)

  const picker = mode === 'picker'
  const startHour = settings.gridStartHour
  const endHour = settings.gridEndHour
  const hourHeight =
    DENSITY_HOUR_HEIGHT[settings.density] ?? DENSITY_HOUR_HEIGHT.normal
  const days = settings.showWeekend ? ALL_DAYS : WORKDAYS
  const canCreate = !picker && Boolean(onCreateRange) && Boolean(weekStart)

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
  const laneWidth = 100 / laneCount

  // Linia "teraz": tylko gdy wyświetlany tydzień zawiera dzisiejszy dzień
  const todayColumn = weekStart ? daysBetween(weekStart, todayISO()) + 1 : null
  const showNow =
    !picker &&
    settings.showNowLine &&
    todayColumn !== null &&
    days.includes(todayColumn) &&
    nowMin >= startMin &&
    nowMin <= endMin

  useEffect(() => {
    const timer = setInterval(() => setNowMin(currentMinutes()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Jednorazowe przewinięcie do bieżącej godziny po pokazaniu siatki
  useEffect(() => {
    if (!settings.autoScrollNow || scrolledRef.current || !nowLineRef.current) return

    scrolledRef.current = true
    nowLineRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [settings.autoScrollNow, showNow])

  // Po aktywowaniu przeciągania na telefonie blokujemy przewijanie strony
  useEffect(() => {
    const preventScroll = (e) => {
      if (dragRef.current.active) e.preventDefault()
    }
    document.addEventListener('touchmove', preventScroll, { passive: false })

    const drag = dragRef.current
    const press = pressRef.current
    return () => {
      document.removeEventListener('touchmove', preventScroll)
      clearTimeout(press.timer)
      clearTimeout(drag.timer)
      delete document.body.dataset.dragging
    }
  }, [])

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
  let hasTests = false

  layers.forEach((layer, laneIndex) => {
    // Kropki sprawdzianów: tylko na własnych zajęciach (nie na planach znajomych)
    const markers =
      !picker &&
      settings.showExamDots &&
      layer.showMarkers !== false &&
      layer.id === user?.id &&
      weekStart
        ? weekMarkers(tests, weekStart)
        : null

    const perDay = {}

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
      const isTest = event.source === 'test'
      if (isCustom) hasCustom = true
      if (isTest) hasTests = true

      // Własny kolor i skrót przedmiotu (kolor tylko na własnym planie)
      const subjectStyle = isClass(event) ? settings.subjectStyles?.[event.title] : null
      const label =
        settings.useAbbreviations && subjectStyle?.abbr
          ? subjectStyle.abbr
          : event.title
      const color =
        event.tileColor ??
        ((layer.applySubjectStyles && subjectStyle?.color) || layer.color)

      const item = {
        key: `${layer.id}-${event.id ?? `${event.day_of_week}-${rawStart}-${event.title}`}`,
        event,
        label,
        color,
        ownerName: layer.name,
        watermark: settings.showWatermark ? (layer.watermark ?? null) : null,
        laneIndex,
        start,
        end,
        isCustom,
        isTest,
        marker: markers && isClass(event) ? (markers[event.title] ?? null) : null,
      }

      ;(perDay[event.day_of_week] ||= []).push(item)
    })

    // Nakładające się kafelki jednej osoby układamy obok siebie
    Object.entries(perDay).forEach(([day, items]) => {
      items.sort((a, b) => a.start - b.start || b.end - a.end)
      blocksByDay[day].push(...layoutColumns(items))
    })
  })

  const dateOf = (event) =>
    weekStart
      ? addDays(weekStart, event.day_of_week - 1)
      : (event.event_date ?? null)

  const openDetail = (block) => {
    setSelected({
      event: block.event,
      color: block.color,
      ownerName: block.ownerName,
      date: dateOf(block.event),
    })
  }

  // ----- Przytrzymanie kafelka zajęć -----
  const canLongPress = (block) =>
    !picker && Boolean(onLongPress) && isClass(block.event)

  const cancelPress = () => {
    clearTimeout(pressRef.current.timer)
    pressRef.current.timer = null
  }

  const startPress = (e, block) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return

    const press = pressRef.current
    press.fired = false
    press.x = e.clientX
    press.y = e.clientY
    clearTimeout(press.timer)
    press.timer = setTimeout(() => {
      press.fired = true
      press.timer = null
      navigator.vibrate?.(30)
      onLongPress({ event: block.event, date: dateOf(block.event) })
    }, LONG_PRESS_MS)
  }

  const movePress = (e) => {
    const press = pressRef.current
    if (press.timer && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) {
      cancelPress()
    }
  }

  const handleTileClick = (block) => {
    if (picker) {
      onPick?.({ event: block.event, date: dateOf(block.event) })
      return
    }
    if (pressRef.current.fired) {
      pressRef.current.fired = false // po długim przytrzymaniu pomijamy zwykłe kliknięcie
      return
    }
    openDetail(block)
  }

  // ----- Przeciąganie po pustym miejscu: tworzenie wydarzenia -----
  const minutesAt = (clientY, column) => {
    const rect = column.getBoundingClientRect()
    const raw = startMin + ((clientY - rect.top) / hourHeight) * 60
    const snapped = Math.round(raw / SNAP_MIN) * SNAP_MIN
    return Math.min(endMin, Math.max(startMin, snapped))
  }

  const finishDrag = () => {
    const drag = dragRef.current
    clearTimeout(drag.timer)
    drag.timer = null
    drag.active = false
    delete document.body.dataset.dragging
    try {
      drag.column?.releasePointerCapture?.(drag.pointerId)
    } catch {
      // wskaźnik mógł już zostać zwolniony
    }
    setDraft(null)
  }

  const beginDrag = (e, day) => {
    if (!canCreate || e.target.closest('button')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    const drag = dragRef.current
    const column = e.currentTarget

    drag.day = day
    drag.column = column
    drag.pointerId = e.pointerId
    drag.pointerType = e.pointerType
    drag.x = e.clientX
    drag.y = e.clientY
    drag.moved = false
    drag.anchor = minutesAt(e.clientY, column)

    const activate = () => {
      drag.active = true
      document.body.dataset.dragging = '1'
      column.setPointerCapture?.(drag.pointerId)

      // Dotyk: samo przytrzymanie daje godzinę od tego momentu; mysz: zaznaczenie rośnie z ruchem
      const initialEnd =
        drag.pointerType === 'mouse'
          ? Math.min(endMin, drag.anchor + SNAP_MIN)
          : Math.min(endMin, drag.anchor + 60)
      drag.range = { startMin: drag.anchor, endMin: initialEnd }
      if (drag.pointerType !== 'mouse') navigator.vibrate?.(15)
      setDraft({ day, ...drag.range })
    }

    clearTimeout(drag.timer)
    if (e.pointerType === 'mouse') {
      activate()
    } else {
      drag.timer = setTimeout(activate, TOUCH_DRAG_DELAY_MS)
    }
  }

  const moveDrag = (e) => {
    const drag = dragRef.current

    if (!drag.active) {
      // Ruch przed aktywacją na dotyku oznacza zwykłe przewijanie strony
      if (drag.timer && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) {
        clearTimeout(drag.timer)
        drag.timer = null
      }
      return
    }

    if (Math.abs(e.clientY - drag.y) > 6) drag.moved = true
    if (!drag.moved) return

    const current = minutesAt(e.clientY, drag.column)
    const from = Math.min(drag.anchor, current)
    let to = Math.max(drag.anchor, current)
    if (to === from) to = Math.min(endMin, from + SNAP_MIN)

    drag.range = { startMin: from, endMin: to }
    setDraft({ day: drag.day, ...drag.range })
  }

  const endDrag = () => {
    const drag = dragRef.current
    if (!drag.active) {
      clearTimeout(drag.timer)
      drag.timer = null
      return
    }

    const range = drag.range
    const shouldCreate =
      range && range.endMin > range.startMin && (drag.moved || drag.pointerType !== 'mouse')
    const day = drag.day

    finishDrag()

    if (shouldCreate) {
      onCreateRange({
        date: addDays(weekStart, day - 1),
        startMin: range.startMin,
        endMin: range.endMin,
      })
    }
  }

  let blockIndex = 0

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
            {days.map((day) => {
              const isToday = day === todayColumn

              return (
                <div
                  key={day}
                  className="border-l border-slate-200 py-2 text-center"
                >
                  <div
                    className={`text-sm ${
                      isToday
                        ? 'font-bold text-indigo-600'
                        : 'font-semibold text-slate-600'
                    }`}
                  >
                    {DAY_NAMES[day]}
                  </div>
                  {weekStart && (
                    <div
                      className={`text-xs ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                      {formatDayMonth(addDays(weekStart, day - 1))}
                    </div>
                  )}
                </div>
              )
            })}
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
                className={`relative border-l border-slate-200 ${
                  canCreate ? 'select-none' : ''
                }`}
                style={{ height: totalHeight }}
                onPointerDown={canCreate ? (e) => beginDrag(e, day) : undefined}
                onPointerMove={canCreate ? moveDrag : undefined}
                onPointerUp={canCreate ? endDrag : undefined}
                onPointerCancel={canCreate ? finishDrag : undefined}
              >
                {/* Linie godzin */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="pointer-events-none absolute inset-x-0 border-t border-slate-100"
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
                        className="slot-pulse pointer-events-none absolute inset-x-0 z-0 border-y border-dashed border-green-500 bg-green-300/30"
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
                  const index = blockIndex++
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

                  const widthPct = laneWidth / block.cols
                  const leftPct = block.laneIndex * laneWidth + block.col * widthPct

                  const style = {
                    top: toPx(block.start),
                    height,
                    left: `calc(${leftPct}% + 1px)`,
                    width: `calc(${widthPct}% - 2px)`,
                    backgroundColor: `${block.color}26`,
                    borderLeft: `4px solid ${block.color}`,
                    animationDelay: `${Math.min(index, 24) * 14}ms`,
                  }

                  if (block.isTest) {
                    // Sprawdziany: mocniejszy kolor i ramka dookoła
                    style.backgroundColor = `${block.color}38`
                    style.border = `2px solid ${block.color}`
                  } else if (block.isCustom) {
                    // Własne wydarzenia: przerywana ramka i delikatny ukośny wzór
                    style.borderTop = `1px dashed ${block.color}`
                    style.borderRight = `1px dashed ${block.color}`
                    style.borderBottom = `1px dashed ${block.color}`
                    style.backgroundImage = `repeating-linear-gradient(135deg, transparent 0px, transparent 5px, ${block.color}24 5px, ${block.color}24 10px)`
                  }

                  const pressable = canLongPress(block)
                  const pressHandlers = pressable
                    ? {
                        onPointerDown: (e) => startPress(e, block),
                        onPointerMove: movePress,
                        onPointerUp: cancelPress,
                        onPointerLeave: cancelPress,
                        onPointerCancel: cancelPress,
                        onContextMenu: (e) => e.preventDefault(),
                      }
                    : {}

                  if (pressable) {
                    style.WebkitTouchCallout = 'none'
                    style.WebkitUserSelect = 'none'
                  }

                  return (
                    <button
                      type="button"
                      key={block.key}
                      onClick={() => handleTileClick(block)}
                      {...pressHandlers}
                      className={`tile-anim absolute z-10 overflow-hidden rounded-md px-1 py-0.5 text-left text-[11px] leading-tight text-slate-800 transition hover:z-20 hover:shadow-md hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        pressable ? 'select-none' : ''
                      }`}
                      style={style}
                      title={[
                        picker ? `Dodaj sprawdzian dla: ${event.title}` : null,
                        block.watermark ? `Osoba: ${block.ownerName}` : null,
                        event.title,
                        `${event.start_time.slice(0, 5)}–${event.end_time.slice(0, 5)}`,
                        event.location,
                        event.event_type,
                        event.teacher,
                        block.marker ? `Sprawdzian: ${block.marker.label}` : null,
                      ]
                        .filter(Boolean)
                        .join('\n')}
                    >
                      <span className="block truncate pr-3 font-semibold">
                        {block.label}
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

                      {block.marker && (
                        <span
                          className="pointer-events-none absolute right-1 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                          style={{ backgroundColor: block.marker.color }}
                        />
                      )}

                      {picker && (
                        <span className="pointer-events-none absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                          <Plus className="h-3.5 w-3.5" />
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

                {/* Zaznaczenie podczas przeciągania (nowe wydarzenie) */}
                {draft && draft.day === day && (
                  <div
                    className="pointer-events-none absolute inset-x-1 z-30 rounded-md border-2 border-dashed border-indigo-500 bg-indigo-500/15"
                    style={{
                      top: toPx(draft.startMin),
                      height: toPx(draft.endMin) - toPx(draft.startMin),
                    }}
                  >
                    <span className="block px-1 text-[10px] font-semibold text-indigo-600">
                      {minutesToTime(draft.startMin)}–{minutesToTime(draft.endMin)}
                    </span>
                  </div>
                )}

                {/* Linia "teraz" */}
                {showNow && day === todayColumn && (
                  <div
                    ref={nowLineRef}
                    className="pointer-events-none absolute inset-x-0 z-20"
                    style={{ top: toPx(nowMin) }}
                  >
                    <div className="h-0.5 bg-red-500" />
                    <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {picker && (
        <p className="text-xs text-slate-500">
          Wybierz zajęcia (kafelek z plusem), do których chcesz dodać
          sprawdzian.
        </p>
      )}

      {!picker && onLongPress && (
        <p className="text-xs text-slate-500">
          Przytrzymaj kafelek zajęć, aby dodać do nich kolokwium lub egzamin.
          Kliknięcie pokazuje szczegóły.
        </p>
      )}

      {canCreate && (
        <p className="text-xs text-slate-500">
          Aby dodać własne wydarzenie, przeciągnij po pustym miejscu (na
          telefonie: przytrzymaj puste miejsce i przeciągnij).
        </p>
      )}

      {hasTests && (
        <p className="text-xs text-slate-500">
          Czerwona ramka to egzamin, pomarańczowa kolokwium, zielona kartkówka
          lub inny sprawdzian.
        </p>
      )}

      {hasCustom && (
        <p className="text-xs text-slate-500">
          Przerywana ramka z ukośnym wzorem oznacza własne wydarzenie (nie
          zajęcia z planu).
        </p>
      )}

      {hiddenCount > 0 && (
        <p className="text-xs text-slate-500">
          Nie pokazano {hiddenCount} zajęć (poza dniami lub godzinami siatki:{' '}
          {startHour}:00–{endHour}:00).
        </p>
      )}

      {selected && (
        <EventDetailModal
          detail={selected}
          onClose={() => setSelected(null)}
          onEditTest={onEditTest}
        />
      )}
    </div>
  )
}