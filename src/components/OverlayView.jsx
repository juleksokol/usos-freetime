import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  User,
  Utensils,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { ALL_DAYS, DAY_NAMES, WORKDAYS, getPalette } from '../lib/constants'
import {
  addDays,
  defaultWeekStart,
  eventsForWeek,
  formatDayMonth,
} from '../lib/dateUtils'
import { findCommonFreeSlots } from '../lib/freeSlots'
import { loadHidden, saveHidden } from '../lib/hiddenStore'
import { minutesToTime } from '../lib/timeUtils'
import useGroups from '../hooks/useGroups'
import usePersistentState from '../hooks/usePersistentState'
import useSchedules from '../hooks/useSchedules'
import WeekGrid from './WeekGrid'
import WeekNav from './WeekNav'

const DURATION_OPTIONS = [30, 45, 60, 90]

export default function OverlayView({ syncTick = 0 }) {
  const { user } = useAuth()
  const { settings, updateSettings } = useSettings()
  const userId = user?.id

  const { groups, loading: groupsLoading, error: groupsError } = useGroups(syncTick)
  const [storedGroupId, setStoredGroupId] = usePersistentState(
    'freetime:lastGroup',
    ''
  )
  const [hiddenState, setHiddenState] = useState({ groupId: null, ids: [] })
  const [weekStart, setWeekStart] = useState(defaultWeekStart)

  const palette = getPalette(settings.personPalette)
  const days = settings.showWeekend ? ALL_DAYS : WORKDAYS

  // Zapamiętana grupa albo pierwsza z listy (gdy zapamiętanej już nie ma)
  const group = groups.find((item) => item.id === storedGroupId) ?? groups[0] ?? null
  const groupId = group?.id ?? null

  // Ukryte osoby w tej grupie (zapamiętywane w przeglądarce)
  const hidden = useMemo(() => {
    if (!groupId) return []
    return hiddenState.groupId === groupId ? hiddenState.ids : loadHidden(groupId)
  }, [hiddenState, groupId])

  // Widoczne osoby = wszyscy członkowie grupy poza ukrytymi
  const selectedIds = useMemo(
    () =>
      group
        ? group.members
            .map((member) => member.userId)
            .filter((id) => !hidden.includes(id))
        : [],
    [group, hidden]
  )

  const {
    schedules,
    loading: loadingSchedules,
    error: schedulesError,
    refresh,
  } = useSchedules(selectedIds, syncTick)

  const error = groupsError || schedulesError

  const updateHidden = (next) => {
    setHiddenState({ groupId, ids: next })
    saveHidden(groupId, next)
  }

  const toggleMember = (memberId) => {
    updateHidden(
      hidden.includes(memberId)
        ? hidden.filter((id) => id !== memberId)
        : [...hidden, memberId]
    )
  }

  const showAll = () => updateHidden([])

  const showOnlyMe = () => {
    if (!group) return
    updateHidden(
      group.members
        .map((member) => member.userId)
        .filter((id) => id !== userId)
    )
  }

  // Kolor osoby jest stały (zależy od miejsca na liście członków grupy),
  // więc ukrywanie innych osób nie zmienia kolorów
  const colorOf = (memberId) => {
    const index = group
      ? group.members.findIndex((member) => member.userId === memberId)
      : 0
    return palette[Math.max(index, 0) % palette.length]
  }

  const activeMembers = group
    ? group.members.filter((member) => !hidden.includes(member.userId))
    : []

  const layers = activeMembers.map((member) => ({
    id: member.userId,
    name:
      member.userId === userId ? `${member.displayName} (Ty)` : member.displayName,
    watermark: member.displayName, // znak wodny z pseudonimem na zajęciach
    color: colorOf(member.userId),
    events: eventsForWeek(schedules[member.userId] ?? [], weekStart),
  }))

  const membersWithoutPlan = activeMembers.filter(
    (member) => schedules[member.userId] && schedules[member.userId].length === 0
  )

  // Wspólne okienka: czas, w którym WSZYSCY widoczni mają wolne
  const range = settings.lunchOnly
    ? {
        dayStartMin: settings.lunchStart * 60,
        dayEndMin: settings.lunchEnd * 60,
      }
    : {
        dayStartMin: settings.gridStartHour * 60,
        dayEndMin: settings.gridEndHour * 60,
      }

  const slots =
    layers.length > 0
      ? findCommonFreeSlots(
          layers.flatMap((layer) => layer.events),
          { ...range, minDuration: settings.minDuration, days }
        )
      : []

  const slotsByDay = days
    .map((day) => ({
      day,
      slots: slots.filter((slot) => slot.day === day),
    }))
    .filter((entry) => entry.slots.length > 0)

  if (groupsLoading) {
    return <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
  }

  if (!group) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
        Najpierw utwórz grupę lub dołącz do istniejącej w zakładce „Grupy”.
        Potem wrócisz tutaj, żeby nałożyć plany i znaleźć wspólne okienka.
      </p>
    )
  }

  const selectClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

  const quickButtonClass =
    'flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100'

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Grupa:
            <select
              value={groupId}
              onChange={(e) => setStoredGroupId(e.target.value)}
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
              onClick={refresh}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              aria-label="Odśwież plany"
              title="Odśwież plany"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              Kliknij osobę, aby ukryć lub pokazać jej plan. Ukryte osoby nie są
              brane pod uwagę przy szukaniu okienek.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={showAll} className={quickButtonClass}>
                <Eye className="h-4 w-4" />
                Pokaż wszystkich
              </button>
              <button type="button" onClick={showOnlyMe} className={quickButtonClass}>
                <User className="h-4 w-4" />
                Tylko ja
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => {
              const visible = !hidden.includes(member.userId)
              const memberEvents = schedules[member.userId]
              const noPlan = memberEvents?.length === 0
              const masked = memberEvents?.some((event) => event.is_masked)

              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => toggleMember(member.userId)}
                  aria-pressed={visible}
                  title={visible ? 'Ukryj tę osobę' : 'Pokaż tę osobę'}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                    visible
                      ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: colorOf(member.userId),
                      opacity: visible ? 1 : 0.35,
                    }}
                  />
                  <span className={visible ? '' : 'line-through'}>
                    {member.displayName}
                    {member.userId === userId && ' (Ty)'}
                  </span>
                  {noPlan && (
                    <span className="text-xs text-amber-600">brak planu</span>
                  )}
                  {masked && (
                    <span
                      className="text-xs text-slate-400"
                      title="Ta osoba udostępnia tylko godziny zajęć"
                    >
                      tylko godziny
                    </span>
                  )}
                  {visible ? (
                    <Eye className="h-4 w-4 text-slate-500" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            Minimalna długość okienka:
            <select
              value={settings.minDuration}
              onChange={(e) => updateSettings({ minDuration: Number(e.target.value) })}
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
              checked={settings.lunchOnly}
              onChange={(e) => updateSettings({ lunchOnly: e.target.checked })}
              className="h-4 w-4 accent-indigo-600"
            />
            Tylko pora obiadu ({settings.lunchStart}:00–{settings.lunchEnd}:00)
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
          Kliknij kafelek, aby zobaczyć wszystkie informacje. Zielone,
          przerywane pola to wspólne okienka widocznych osób.
        </p>

        <div className="mt-4">
          {loadingSchedules ? (
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          ) : layers.length === 0 ? (
            <p className="text-sm text-slate-500">
              Wszyscy są ukryci. Pokaż co najmniej jedną osobę.
            </p>
          ) : (
            <WeekGrid layers={layers} highlights={slots} weekStart={weekStart} />
          )}
        </div>
      </section>

      {!settings.hiddenPanels.includes('overlaySlots') && (
        <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Utensils className="h-5 w-5 text-green-600" />
            Wspólne okienka w tym tygodniu
          </h2>

          {layers.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              Liczone dla: {layers.map((layer) => layer.watermark).join(', ')}.
            </p>
          )}

          {loadingSchedules || layers.length === 0 ? null : slotsByDay.length ===
            0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Brak wspólnych okienek spełniających warunki. Spróbuj skrócić
              minimalną długość, wyłączyć filtr pory obiadu albo ukryć kogoś z
              ekipy.
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
      )}
    </div>
  )
}