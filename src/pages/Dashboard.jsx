import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Layers,
  Loader2,
  LogOut,
  Settings as SettingsIcon,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { TestsContext } from '../context/TestsContext'
import { getPalette } from '../lib/constants'
import { defaultWeekStart, eventsForWeek } from '../lib/dateUtils'
import { loadCache, saveCache } from '../lib/offlineCache'
import { fetchUserSchedule } from '../lib/scheduleService'
import { fetchTests } from '../lib/testService'
import { draftFromTile, testToDraft, testToEvent } from '../lib/tests'
import useRealtimeSync from '../hooks/useRealtimeSync'
import usePersistentState from '../hooks/usePersistentState'
import useTestReminders from '../hooks/useTestReminders'
import CustomEvents from '../components/CustomEvents'
import ExtraSettings from '../components/ExtraSettings'
import GroupsPanel from '../components/GroupsPanel'
import ImportSchedule from '../components/ImportSchedule'
import OverlayView from '../components/OverlayView'
import PushupCounter from '../components/PushupCounter'
import SettingsPanel from '../components/SettingsPanel'
import TestDialog from '../components/TestDialog'
import TestsTab from '../components/TestsTab'
import ThemeToggle from '../components/ThemeToggle'
import TodayView from '../components/TodayView'
import UpcomingTests from '../components/UpcomingTests'
import WeekGrid from '../components/WeekGrid'
import WeekNav from '../components/WeekNav'

const TABS = [
  { id: 'today', label: 'Dziś', icon: CalendarCheck },
  { id: 'plan', label: 'Mój plan', icon: CalendarDays },
  { id: 'tests', label: 'Kolokwia', icon: ClipboardList },
  { id: 'groups', label: 'Grupy', icon: Users },
  { id: 'overlay', label: 'Wspólne okienka', icon: Layers },
  { id: 'settings', label: 'Ustawienia', icon: SettingsIcon },
]

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const { settings, isDark } = useSettings()

  // Zakładka startowa: ostatnio używana albo wybrana w ustawieniach
  const [lastTab, setLastTab] = usePersistentState('freetime:tab', 'today')
  const [sessionTab, setSessionTab] = useState(() =>
    settings.startTab === 'last' ? lastTab : settings.startTab
  )

  const visibleTabs = TABS.filter(
    (item) => item.id === 'settings' || !settings.hiddenTabs.includes(item.id)
  )
  const tab = visibleTabs.some((item) => item.id === sessionTab)
    ? sessionTab
    : visibleTabs[0].id

  const selectTab = (id) => {
    setSessionTab(id)
    setLastTab(id)
  }

  const showPanel = (id) => !settings.hiddenPanels.includes(id)

  const [weekStart, setWeekStart] = useState(defaultWeekStart)
  const [events, setEvents] = useState([])
  const [tests, setTests] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [offlineNote, setOfflineNote] = useState('')
  const [syncTick, setSyncTick] = useState(0) // zmiana = widoki grup pobierają dane ponownie

  // Okno dodawania/edycji sprawdzianu i widok zakładki "Kolokwia" (lista albo wybór zajęć)
  const [dialog, setDialog] = useState(null)
  const [testsView, setTestsView] = useState('list')

  const name = profile?.display_name ?? user?.email
  const userId = user?.id

  const loadEvents = useCallback(async () => {
    if (!userId) return
    try {
      const data = await fetchUserSchedule(userId)
      setEvents(data)
      saveCache(`events:${userId}`, data)
      setLoadError('')
      setOfflineNote('')
    } catch (err) {
      // Brak połączenia: pokazujemy ostatnio zapisany plan
      const cached = loadCache(`events:${userId}`)
      if (cached) {
        setEvents(cached.data)
        setLoadError('')
        setOfflineNote(
          `Brak połączenia z serwerem. Pokazuję plan zapisany ${new Date(
            cached.savedAt
          ).toLocaleString('pl-PL')}.`
        )
      } else {
        setLoadError(`Nie udało się pobrać planu: ${err.message}`)
      }
    } finally {
      setLoadingEvents(false)
    }
  }, [userId])

  const loadTests = useCallback(async () => {
    if (!userId) return
    try {
      const data = await fetchTests(userId)
      setTests(data)
      saveCache(`tests:${userId}`, data)
    } catch {
      const cached = loadCache(`tests:${userId}`)
      if (cached) setTests(cached.data)
    }
  }, [userId])

  useEffect(() => {
    loadEvents()
    loadTests()
  }, [loadEvents, loadTests])

  // Realtime: zmiany Twoich zajęć i składu grup oraz powrót do karty aplikacji
  useRealtimeSync(userId, () => {
    loadEvents()
    loadTests()
    setSyncTick((tick) => tick + 1)
  })

  // Przypomnienia o sprawdzianach (dzień przed i w dniu sprawdzianu)
  useTestReminders(tests, {
    enabled: settings.remindersEnabled,
    hour: settings.reminderHour,
  })

  // Animacje: wyłączenie oraz płynna zmiana motywu
  useEffect(() => {
    document.documentElement.classList.toggle('no-anim', !settings.animations)
  }, [settings.animations])

  const themeInitRef = useRef(true)
  useEffect(() => {
    if (themeInitRef.current) {
      themeInitRef.current = false
      return
    }
    const root = document.documentElement
    root.classList.add('theme-fade')
    const timer = setTimeout(() => root.classList.remove('theme-fade'), 450)
    return () => clearTimeout(timer)
  }, [isDark])

  // Przesuwany wskaźnik aktywnej zakładki
  const tabRefs = useRef({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const update = () => {
      const element = tabRefs.current[tab]
      if (element) {
        setIndicator({ left: element.offsetLeft, width: element.offsetWidth })
      }
    }

    update()
    tabRefs.current[tab]?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    })

    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [tab, visibleTabs.length, settings.fontScale])

  // Sprawdziany jako kafelki do narysowania na planie
  const testEvents = useMemo(() => tests.map(testToEvent), [tests])
  const testsValue = useMemo(() => ({ tests }), [tests])

  // Lista przedmiotów do wyboru w oknie dodawania sprawdzianu
  const subjects = useMemo(() => {
    const names = new Set(
      events.filter((event) => event.source !== 'custom').map((event) => event.title)
    )
    tests.forEach((test) => names.add(test.subject))
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pl'))
  }, [events, tests])

  const openDialog = (draft) => setDialog({ draft })
  const openTest = (test) => openDialog(testToDraft(test))
  const openTestById = (id) => {
    const test = tests.find((item) => item.id === id)
    if (test) openTest(test)
  }

  const handleSaved = async () => {
    await loadTests()
    setDialog(null)
    setTestsView('list')
  }

  const weekEvents = eventsForWeek(events, weekStart)
  const myLayers = [
    {
      id: userId,
      name: name ?? 'Ja',
      color: getPalette(settings.personPalette)[0],
      // gdy sprawdziany są kafelkami, kropek nie pokazujemy
      showMarkers: !settings.showTestsOnPlan,
      events: [
        ...weekEvents,
        ...(settings.showTestsOnPlan ? eventsForWeek(testEvents, weekStart) : []),
      ],
    },
  ]

  return (
    <TestsContext.Provider value={testsValue}>
      <div className="min-h-screen">
        <header className="app-header shadow-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="logo-icon h-6 w-6 text-indigo-600" />
              <span className="text-lg font-bold text-slate-800">
                USOS FreeTime
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-600 sm:inline">
                {name}
              </span>
              <ThemeToggle />
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                Wyloguj
              </button>
            </div>
          </div>

          <nav className="relative mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                ref={(element) => {
                  tabRefs.current[id] = element
                }}
                onClick={() => selectTab(id)}
                className={`flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  tab === id
                    ? 'text-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            <span
              className="tab-indicator"
              style={{ left: indicator.left, width: indicator.width }}
            />
          </nav>
        </header>

        <main className="mx-auto max-w-5xl p-4 sm:p-6">
          {offlineNote && (
            <p className="mb-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {offlineNote}
            </p>
          )}

          <div key={tab} className="stagger flex flex-col gap-6">
            {tab === 'today' && (
              <>
                {showPanel('pushups') && <PushupCounter />}
                {showPanel('upcomingTests') && (
                  <UpcomingTests tests={tests} onOpen={openTest} />
                )}
                <TodayView syncTick={syncTick} />
              </>
            )}

            {tab === 'plan' && (
              <>
                <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Mój tygodniowy plan
                    </h2>
                    <WeekNav weekStart={weekStart} onChange={setWeekStart} />
                  </div>

                  <div className="mt-4">
                    {loadingEvents ? (
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    ) : loadError ? (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {loadError}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {events.length === 0 && (
                          <p className="text-sm text-slate-500">
                            Nie masz jeszcze zapisanych zajęć. Zaimportuj plik
                            poniżej albo dodaj własne wydarzenie.
                          </p>
                        )}
                        {events.length > 0 && weekEvents.length === 0 && (
                          <p className="text-sm text-slate-500">
                            W tym tygodniu nie masz zajęć. Użyj strzałek, aby
                            przejść do innego tygodnia.
                          </p>
                        )}
                        <WeekGrid
                          layers={myLayers}
                          weekStart={weekStart}
                          onLongPress={({ event, date }) =>
                            openDialog(draftFromTile(event, date))
                          }
                          onEditTest={openTestById}
                        />
                      </div>
                    )}
                  </div>
                </section>

                {showPanel('customEvents') && (
                  <CustomEvents events={events} onChanged={loadEvents} />
                )}
                {showPanel('import') && <ImportSchedule onImported={loadEvents} />}
              </>
            )}

            {tab === 'tests' && (
              <TestsTab
                view={testsView}
                setView={setTestsView}
                tests={tests}
                events={events}
                onOpenDialog={openDialog}
              />
            )}

            {tab === 'groups' && <GroupsPanel />}

            {tab === 'overlay' && <OverlayView syncTick={syncTick} />}

            {tab === 'settings' && (
              <>
                <ExtraSettings />
                <SettingsPanel onDataChanged={loadEvents} />
              </>
            )}
          </div>
        </main>

        {dialog && (
          <TestDialog
            initial={dialog.draft}
            subjects={subjects}
            onClose={() => setDialog(null)}
            onSaved={handleSaved}
          />
        )}
      </div>
    </TestsContext.Provider>
  )
}