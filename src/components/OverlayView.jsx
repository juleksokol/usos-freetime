import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, Utensils } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  DAY_NAMES,
  GRID_END_HOUR,
  GRID_START_HOUR,
  PERSON_COLORS,
  WORKDAYS,
} from '../lib/constants'
import {
  addDays,
  defaultWeekStart,
  eventsForWeek,
  formatDayMonth,
} from '../lib/dateUtils'
import { findCommonFreeSlots } from '../lib/freeSlots'
import { fetchMyGroups } from '../lib/groupService'
import { fetchUserSchedule } from '../lib/scheduleService'
import { minutesToTime } from '../lib/timeUtils'
import WeekGrid from './WeekGrid'
import WeekNav from './WeekNav'

const DURATION_OPTIONS = [30, 45, 60, 90]
const LUNCH_START = 11 * 60
const LUNCH_END = 16 * 60

export default function OverlayView() {
  const { user } = useAuth()
  const userId = user?.id

  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [groupId, setGroupId] = useState('')
  const [selected, setSelected] = useState([]) // id zaznaczonych osób
  const [schedules, setSchedules] = useState({}) // userId -> wszystkie zajęcia
  const [error, setError] = useState('')
  const [weekStart, setWeekStart] = useState(defaultWeekStart)
  const [minDuration, setMinDuration] = useState(45)
  const [lunchOnly, setLunchOnly] = useState(false)

  // Pobranie grup użytkownika
  useEffect(() => {
    let cancelled = false

    fetchMyGroups()
      .then((data) => {
        if (cancelled) return
        setGroups(data)
        if (data.length > 0) {
          setGroupId(data[0].id)
          setSelected(data[0].members.map((member) => member.userId))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(`Nie udało się pobrać grup: ${err.message}`)
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Pobranie planów tylko tych zaznaczonych osób, których jeszcze nie mamy
  // (osobno dla każdej osoby, żeby nie trafić w limit 1000 wierszy jednego zapytania)
  useEffect(() => {
    const missing = selected.filter((id) => !(id in schedules))
    if (missing.length === 0) return

    let cancelled = false

    Promise.all(missing.map(async (id) => [id, await fetchUserSchedule(id)]))
      .then((entries) => {
        if (cancelled) return
        setSchedules((previous) => ({
          ...previous,
          ...Object.fromEntries(entries),
        }))
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(`Nie udało się pobrać planów: ${err.message}`)
      })

    return () => {
      cancelled = true
    }
  }, [selected, schedules])

  const loadingSchedules =
    !error && selected.some((id) => !(id in schedules))

  const group = groups.find((item) => item.id === groupId) ?? null

  const handleGroupChange = (id) => {
    const next = groups.find((item) => item.id === id)
    setGroupId(id)
    setSelected(next ? next.members.map((member) => member.userId) : [])
  }

  const toggleMember = (memberId) => {
    setSelected((previous) =>
      previous.includes(memberId)
        ? previous.filter((id) => id !== memberId)
        : [...previous, memberId]
    )
  }

  const handleRefresh = () => {
    setSchedules({})
    setError('')
  }

  // Kolor osoby jest stały (zależy od miejsca na liście członków grupy)
  const colorOf = (memberId) => {
    const index = group
      ? group.members.findIndex((member) => member.userId === memberId)
      : 0
    return PERSON_COLORS[Math.max(index, 0) % PERSON_COLORS.length]
  }

  const activeMembers = group
    ? group.members.filter((member) => selected.includes(member.userId))
    : []

  const layers = activeMembers.map((member) => ({
    id: member.userId,
    name:
      member.userId === userId ? `${member.displayName} (Ty)` : member.displayName,
    color: colorOf(member.userId),
    events: eventsForWeek(schedules[member.userId] ?? [], weekStart),
  }))

  const membersWithoutPlan = activeMembers.filter(
    (member) => schedules[member.userId] && schedules[member.userId].length === 0
  )

  // Wspólne okienka: czas, w którym WSZYSCY zaznaczeni mają wolne
  const range = lunchOnly
    ? { dayStartMin: LUNCH_START, dayEndMin: LUNCH_END }
    : { dayStartMin: GRID_START_HOUR * 60, dayEndMin: GRID_END_HOUR * 60 }

  const slots =
    layers.length > 0
      ? findCommonFreeSlots(
          layers.flatMap((layer) => layer.events),
          { ...range, minDuration }
        )
      : []

  const slotsByDay = WORKDAYS.map((day) => ({
    day,
    slots: slots.filter((slot) => slot.day === day),
  })).filter((entry) => entry.slots.length > 0)

  if (groupsLoading) {
    return <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
        Najpierw utwórz grupę lub dołącz do istniejącej w zakładce „Grupy”.
        Potem wrócisz tutaj, żeby nałożyć plany i znaleźć wspólne okienka.
      </p>
    )
  }

  const selectClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Grupa:
            <select
              value={groupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className={selectClass}
            >
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <WeekNav weekStart={weekStart} onChange={setWeekStart} />
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              aria-label="Odśwież plany"
              title="Odśwież plany"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {group && (
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => {
              const checked = selected.includes(member.userId)
              const noPlan = schedules[member.userId]?.length === 0

              return (
                <label
                  key={member.userId}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                    checked
                      ? 'border-slate-300 bg-white text-slate-800'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(member.userId)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: colorOf(member.userId) }}
                  />
                  {member.displayName}
                  {member.userId === userId && ' (Ty)'}
                  {noPlan && ' (brak planu)'}
                </label>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            Minimalna długość okienka:
            <select
              value={minDuration}
              onChange={(e) => setMinDuration(Number(e.target.value))}
              className={selectClass}
            >
              {DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={lunchOnly}
              onChange={(e) => setLunchOnly(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            Tylko pora obiadu (11:00–16:00)
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {membersWithoutPlan.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Brak zaimportowanego planu:{' '}
          {membersWithoutPlan.map((member) => member.displayName).join(', ')}.
          Okienka mogą być zawyżone, dopóki ta osoba nie zaimportuje planu.
        </p>
      )}

      <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Nałożone plany
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Zielone, przerywane pola to wspólne okienka: wszyscy zaznaczeni mają
          wtedy wolne.
        </p>

        <div className="mt-4">
          {loadingSchedules ? (
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          ) : layers.length === 0 ? (
            <p className="text-sm text-slate-500">
              Zaznacz co najmniej jedną osobę.
            </p>
          ) : (
            <WeekGrid layers={layers} highlights={slots} weekStart={weekStart} />
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Utensils className="h-5 w-5 text-green-600" />
          Wspólne okienka w tym tygodniu
        </h2>

        {loadingSchedules || layers.length === 0 ? null : slotsByDay.length ===
          0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Brak wspólnych okienek spełniających warunki. Spróbuj skrócić
            minimalną długość lub wyłączyć filtr pory obiadu.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {slotsByDay.map(({ day, slots: daySlots }) => (
              <li
                key={day}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <span className="w-40 font-medium text-slate-700">
                  {DAY_NAMES[day]} {formatDayMonth(addDays(weekStart, day - 1))}
                </span>
                {daySlots.map((slot) => (
                  <span
                    key={`${slot.startMin}-${slot.endMin}`}
                    className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800"
                  >
                    {minutesToTime(slot.startMin)}–{minutesToTime(slot.endMin)}{' '}
                    <span className="font-normal text-green-600">
                      ({slot.endMin - slot.startMin} min)
                    </span>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}