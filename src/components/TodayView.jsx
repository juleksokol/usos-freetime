import { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Utensils,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { ALL_DAYS, WORKDAYS, getPalette } from '../lib/constants'
import {
  addDays,
  eventsOnDate,
  formatLongDate,
  todayISO,
  weekdayOf,
} from '../lib/dateUtils'
import { findCommonFreeSlots } from '../lib/freeSlots'
import { loadHidden } from '../lib/hiddenStore'
import { minutesToTime, timeToMinutes } from '../lib/timeUtils'
import useGroups from '../hooks/useGroups'
import usePersistentState from '../hooks/usePersistentState'
import useSchedules from '../hooks/useSchedules'

function currentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

// Czy osoba ma teraz zajęcia i jak długo
function statusNow(events, nowMin) {
  const sorted = [...events].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  )

  const current = sorted.find(
    (event) =>
      timeToMinutes(event.start_time) <= nowMin &&
      nowMin < timeToMinutes(event.end_time)
  )
  if (current) {
    return {
      busy: true,
      label: `${current.title} do ${current.end_time.slice(0, 5)}`,
    }
  }

  const next = sorted.find((event) => timeToMinutes(event.start_time) > nowMin)
  return {
    busy: false,
    label: next
      ? `wolny do ${next.start_time.slice(0, 5)}`
      : 'wolny do końca dnia',
  }
}

export default function TodayView({ syncTick = 0 }) {
  const { user, profile } = useAuth()
  const { settings } = useSettings()
  const userId = user?.id
  const myName = profile?.display_name ?? 'Ja'

  const { groups, loading: groupsLoading } = useGroups(syncTick)
  const [storedGroupId, setStoredGroupId] = usePersistentState(
    'freetime:lastGroup',
    ''
  )
  const [date, setDate] = useState(todayISO)
  const [nowMin, setNowMin] = useState(currentMinutes)

  useEffect(() => {
    const timer = setInterval(() => setNowMin(currentMinutes()), 60000)
    return () => clearInterval(timer)
  }, [])

  const palette = getPalette(settings.personPalette)
  const days = settings.showWeekend ? ALL_DAYS : WORKDAYS
  const startMin = settings.gridStartHour * 60
  const endMin = settings.gridEndHour * 60
  const showPanel = (id) => !settings.hiddenPanels.includes(id)

  const group = groups.find((item) => item.id === storedGroupId) ?? groups[0] ?? null

  // Osoby widoczne w widoku (z uwzględnieniem ukrytych w zakładce „Wspólne okienka”)
  const members = useMemo(() => {
    if (!group) return userId ? [{ userId, displayName: myName }] : []
    const hidden = loadHidden(group.id)
    return group.members.filter((member) => !hidden.includes(member.userId))
  }, [group, userId, myName])

  const memberIds = useMemo(() => members.map((member) => member.userId), [members])
  const { schedules, loading, error } = useSchedules(memberIds, syncTick)

  const colorOf = (memberId) => {
    const index = group
      ? group.members.findIndex((member) => member.userId === memberId)
      : 0
    return palette[Math.max(index, 0) % palette.length]
  }

  const isToday = date === todayISO()
  const weekday = weekdayOf(date)
  const dayIncluded = days.includes(weekday)

  const dayEvents = (memberId) => eventsOnDate(schedules[memberId] ?? [], date)

  const windowStart = isToday ? Math.max(startMin, nowMin) : startMin

  const slots =
    !loading && members.length > 0 && dayIncluded
      ? findCommonFreeSlots(
          members.flatMap((member) => dayEvents(member.userId)),
          {
            dayStartMin: windowStart,
            dayEndMin: endMin,
            minDuration: settings.minDuration,
            days,
          }
        ).filter((slot) => slot.day === weekday)
      : []

  if (groupsLoading) {
    return <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
  }

  const navButtonClass =
    'flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100'

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <CalendarCheck className="h-5 w-5 text-indigo-600" />
            {isToday ? 'Dziś' : 'Dzień'}: {formatLongDate(date)}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(addDays(date, -1))}
              className={navButtonClass}
              aria-label="Poprzedni dzień"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDate(addDays(date, 1))}
              className={navButtonClass}
              aria-label="Następny dzień"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => setDate(todayISO())} className={navButtonClass}>
              Dziś
            </button>
          </div>
        </div>

        {groups.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Grupa:
            <select
              value={group?.id ?? ''}
              onChange={(e) => setStoredGroupId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {!group && (
          <p className="text-sm text-slate-500">
            Nie należysz do żadnej grupy, więc widzisz tylko swój dzień. Dołącz
            do grupy w zakładce „Grupy”, żeby zobaczyć znajomych.
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      ) : members.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
          Wszyscy są ukryci. Pokaż kogoś w zakładce „Wspólne okienka”.
        </p>
      ) : (
        <>
          {showPanel('now') && isToday && dayIncluded && (
            <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
              <h3 className="text-base font-semibold text-slate-800">Teraz</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {members.map((member) => {
                  const status = statusNow(dayEvents(member.userId), nowMin)

                  return (
                    <li
                      key={member.userId}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colorOf(member.userId) }}
                      />
                      <span className="font-medium text-slate-800">
                        {member.displayName}
                        {member.userId === userId && ' (Ty)'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          status.busy
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {status.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {showPanel('todaySlots') && (
            <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Utensils className="h-5 w-5 text-green-600" />
                Wspólne okienka {isToday ? '(od teraz)' : ''}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Dla: {members.map((member) => member.displayName).join(', ')}.
                Minimalna długość: {settings.minDuration} min (zmienisz ją w
                Ustawieniach).
              </p>

              {!dayIncluded ? (
                <p className="mt-3 text-sm text-slate-500">
                  Ten dzień nie jest uwzględniany w okienkach (weekend możesz
                  włączyć w Ustawieniach).
                </p>
              ) : slots.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Brak wspólnych okienek w tym dniu.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <span
                      key={`${slot.startMin}-${slot.endMin}`}
                      className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
                    >
                      {minutesToTime(slot.startMin)}–{minutesToTime(slot.endMin)}{' '}
                      <span className="font-normal text-green-600">
                        ({slot.endMin - slot.startMin} min)
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {showPanel('todayPeople') && (
            <div className="grid gap-4 md:grid-cols-2">
              {members.map((member) => {
                const events = dayEvents(member.userId).sort((a, b) =>
                  a.start_time.localeCompare(b.start_time)
                )

                return (
                  <article
                    key={member.userId}
                    className="rounded-2xl bg-white p-4 shadow sm:p-6"
                    style={{ borderTop: `4px solid ${colorOf(member.userId)}` }}
                  >
                    <h3 className="font-semibold text-slate-800">
                      {member.displayName}
                      {member.userId === userId && ' (Ty)'}
                    </h3>

                    {events.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        Brak zajęć tego dnia.
                      </p>
                    ) : (
                      <ul className="mt-2 divide-y divide-slate-100">
                        {events.map((event) => (
                          <li key={event.id} className="py-2 text-sm">
                            <div className="font-medium text-slate-800">
                              {event.start_time.slice(0, 5)}–
                              {event.end_time.slice(0, 5)} {event.title}
                            </div>
                            {(event.location || event.event_type) && (
                              <div className="text-xs text-slate-500">
                                {[event.event_type, event.location]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}