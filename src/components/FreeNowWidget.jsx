import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { ALL_DAYS, WORKDAYS, getPalette } from '../lib/constants'
import { eventsOnDate, todayISO, weekdayOf } from '../lib/dateUtils'
import { loadHidden } from '../lib/hiddenStore'
import { memberStatus, nextCommonSlot } from '../lib/presence'
import { minutesToTime } from '../lib/timeUtils'
import useGroups from '../hooks/useGroups'
import usePersistentState from '../hooks/usePersistentState'
import useSchedules from '../hooks/useSchedules'
import useTestBusy from '../hooks/useTestBusy'

function currentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

const formatMinutes = (min) =>
  min < 60
    ? `${min} min`
    : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`

// Karta na górze strony "Dziś": kto jest teraz wolny i kiedy najbliższe wspólne okienko
export default function FreeNowWidget({ syncTick = 0 }) {
  const { settings } = useSettings()
  const { groups, loading: groupsLoading } = useGroups(syncTick)
  const [storedGroupId] = usePersistentState('freetime:lastGroup', '')
  const [nowMin, setNowMin] = useState(currentMinutes)

  useEffect(() => {
    const timer = setInterval(() => setNowMin(currentMinutes()), 30000)
    return () => clearInterval(timer)
  }, [])

  const palette = getPalette(settings.personPalette)
  const group = groups.find((item) => item.id === storedGroupId) ?? groups[0] ?? null

  // Widoczne osoby (z uwzględnieniem ukrytych w zakładce „Wspólne okienka”)
  const members = useMemo(() => {
    if (!group) return []
    const hidden = loadHidden(group.id)
    return group.members.filter((member) => !hidden.includes(member.userId))
  }, [group])

  const memberIds = useMemo(() => members.map((member) => member.userId), [members])
   const { schedules, loading } = useSchedules(memberIds, syncTick)
  const testBusy = useTestBusy()
  if (groupsLoading || !group || members.length === 0) return null

  const today = todayISO()
  const day = weekdayOf(today)
  const days = settings.showWeekend ? ALL_DAYS : WORKDAYS
  const dayIncluded = days.includes(day)

  const colorOf = (memberId) =>
    palette[
      Math.max(group.members.findIndex((member) => member.userId === memberId), 0) %
        palette.length
    ]

    // Twoje sprawdziany liczą się jako zajęty czas (widzisz je tylko Ty)
  const dayEventsOf = (memberId) => [
    ...eventsOnDate(schedules[memberId] ?? [], today),
    ...(memberId === testBusy.userId ? testBusy.onDate(today) : []),
  ]

  const statuses = members
    .map((member) => ({ member, ...memberStatus(dayEventsOf(member.userId), nowMin) }))
    .sort((a, b) => Number(a.busy) - Number(b.busy))

  const freeCount = statuses.filter((status) => !status.busy).length

  const slot = dayIncluded
    ? nextCommonSlot(
        members.flatMap((member) => dayEventsOf(member.userId)),
        nowMin,
        {
          endMin: settings.gridEndHour * 60,
          minDuration: settings.minDuration,
          day,
        }
      )
    : null

  let slotText = 'Dziś nie ma już wspólnych okienek.'
  if (slot && slot.startMin <= nowMin) {
    slotText = `Wszyscy są wolni jeszcze ${formatMinutes(slot.endMin - nowMin)} (do ${minutesToTime(slot.endMin)}).`
  } else if (slot) {
    slotText = `Najbliższe wspólne okienko: ${minutesToTime(slot.startMin)}–${minutesToTime(slot.endMin)} (za ${formatMinutes(slot.startMin - nowMin)}).`
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
        Kto jest wolny teraz
        <span className="text-sm font-normal text-slate-400">
          {minutesToTime(nowMin)}
        </span>
      </h3>

      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Sprawdzam plany…</p>
      ) : !dayIncluded ? (
        <p className="mt-3 text-sm text-slate-500">
          Dziś weekend: nikt nie ma zajęć w siatce.
        </p>
      ) : (
        <>
          <p className="mt-3 text-lg font-semibold text-slate-800">
            {freeCount} z {members.length}{' '}
            {members.length === 1 ? 'osoby' : 'osób'} wolnych
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            {slotText}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <span
                key={status.member.userId}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                  status.busy
                    ? 'border-slate-200 bg-slate-50 text-slate-500'
                    : 'border-green-200 bg-green-50 text-green-800'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colorOf(status.member.userId) }}
                />
                {status.member.displayName}:{' '}
                {status.busy
                  ? `zajęcia do ${minutesToTime(status.until)}`
                  : status.until
                    ? `wolne do ${minutesToTime(status.until)}`
                    : 'wolne do końca dnia'}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}