import { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Utensils,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import { useSettings } from '../context/SettingsContext'
import { ALL_DAYS, WORKDAYS, getPalette } from '../lib/constants'
import { addDays, eventsOnDate, todayISO, weekdayOf } from '../lib/dateUtils'
import { findCommonFreeSlots } from '../lib/freeSlots'
import { loadHidden } from '../lib/hiddenStore'
import { minutesToTime } from '../lib/timeUtils'
import useFormat from '../hooks/useFormat'
import useGroups from '../hooks/useGroups'
import usePersistentState from '../hooks/usePersistentState'
import useSchedules from '../hooks/useSchedules'
import useTestBusy from '../hooks/useTestBusy'
import FreeNowWidget from './FreeNowWidget'
import PushupCounter from './PushupCounter'
import ReorderableList from './ReorderableList'
import UpcomingTests from './UpcomingTests'

const ALL_IDS = [
  'freeNow',
  'pushups',
  'upcomingTests',
  'dayHeader',
  'todaySlots',
  'todayPeople',
]

function currentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

/**
 * Zakładka "Dziś" złożona z przesuwanych bloków.
 * tests / onOpenTest: sprawdziany (karta "Nadchodzące sprawdziany")
 * editing / order / onReorder: tryb edycji układu
 */
export default function TodayTab({
  syncTick = 0,
  tests,
  onOpenTest,
  editing,
  order,
  onReorder,
}) {
  const { user, profile } = useAuth()
  const { settings } = useSettings()
  const { t } = useI18n()
  const fmt = useFormat()
  const userId = user?.id
  const myName = profile?.display_name ?? t('today.me')
  const testBusy = useTestBusy()

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
  const showPanel = (panelId) => !settings.hiddenPanels.includes(panelId)

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
  const busy = groupsLoading || loading

  const dayEvents = (memberId) => eventsOnDate(schedules[memberId] ?? [], date)

  const windowStart = isToday ? Math.max(startMin, nowMin) : startMin

  const slots =
    !busy && members.length > 0 && dayIncluded
      ? findCommonFreeSlots(
          members.flatMap((member) =>
            member.userId === testBusy.userId
              ? [...dayEvents(member.userId), ...testBusy.onDate(date)]
              : dayEvents(member.userId)
          ),
          {
            dayStartMin: windowStart,
            dayEndMin: endMin,
            minDuration: settings.minDuration,
            days,
          }
        ).filter((slot) => slot.day === weekday)
      : []

  const navButtonClass =
    'flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100'

  const dayHeader = (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-800">
          <CalendarCheck className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
          <span className="min-w-0">
            {t(isToday ? 'today.headingToday' : 'today.headingDay', {
              date: fmt.longDate(date),
            })}
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDate(addDays(date, -1))}
            className={navButtonClass}
            aria-label={t('today.prevDay')}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setDate(addDays(date, 1))}
            className={navButtonClass}
            aria-label={t('today.nextDay')}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button onClick={() => setDate(todayISO())} className={navButtonClass}>
            {t('today.todayButton')}
          </button>
        </div>
      </div>

      {groups.length > 1 && (
        <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {t('today.group')}
          <select
            value={group?.id ?? ''}
            onChange={(e) => setStoredGroupId(e.target.value)}
            className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {groups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {!groupsLoading && !group && (
        <p className="text-sm text-slate-500">{t('today.noGroup')}</p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  )

  const slotsBlock = !showPanel('todaySlots') ? null : (
    <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
        <Utensils className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
        {t('today.slotsTitle')} {isToday ? t('today.slotsFromNow') : ''}
      </h3>

      {busy ? (
        <Loader2 className="mt-3 h-6 w-6 animate-spin text-indigo-600" aria-hidden="true" />
      ) : members.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{t('today.allHidden')}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-500">
            {t('today.slotsFor', {
              names: members.map((member) => member.displayName).join(', '),
              min: settings.minDuration,
            })}
          </p>

          {!dayIncluded ? (
            <p className="mt-3 text-sm text-slate-500">{t('today.dayExcluded')}</p>
          ) : slots.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t('today.noSlots')}</p>
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
        </>
      )}
    </section>
  )

  const peopleBlock =
    !showPanel('todayPeople') || busy || members.length === 0 ? null : (
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
                {member.userId === userId && ` ${t('today.you')}`}
              </h3>

              {events.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">{t('today.noClasses')}</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100">
                  {events.map((event) => (
                    <li key={event.id} className="py-2 text-sm">
                      <div className="font-medium text-slate-800">
                        {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}{' '}
                        {event.is_masked ? t('common.busy') : event.title}
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
    )

  return (
    <ReorderableList
      id="today"
      allIds={ALL_IDS}
      order={order}
      editing={editing}
      onReorder={onReorder}
      items={[
        {
          id: 'freeNow',
          label: t('settings.panel.freeNow'),
          node: showPanel('freeNow') ? <FreeNowWidget syncTick={syncTick} /> : null,
        },
        {
          id: 'pushups',
          label: t('settings.panel.pushups'),
          node: showPanel('pushups') ? <PushupCounter /> : null,
        },
        {
          id: 'upcomingTests',
          label: t('settings.panel.upcomingTests'),
          node: showPanel('upcomingTests') ? (
            <UpcomingTests tests={tests} onOpen={onOpenTest} />
          ) : null,
        },
        { id: 'dayHeader', label: t('today.blockDay'), node: dayHeader },
        { id: 'todaySlots', label: t('settings.panel.todaySlots'), node: slotsBlock },
        { id: 'todayPeople', label: t('today.blockPeople'), node: peopleBlock },
      ]}
    />
  )
}
