import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardList,
  Layers,
  Loader2,
  LogOut,
  Pencil,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Users,
} from 'lucide-react'
import { ActionsContext } from '../context/ActionsContext'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { TestsContext } from '../context/TestsContext'
import { mergeVisibleOrder, resolveOrder } from '../lib/blockOrder'
import { getPalette } from '../lib/constants'
import { defaultWeekStart, eventsForWeek, mondayOf } from '../lib/dateUtils'
import { loadCache, saveCache } from '../lib/offlineCache'
import { fetchUserSchedule } from '../lib/scheduleService'
import { fetchTests } from '../lib/testService'
import { draftFromTile, testToDraft, testToEvent } from '../lib/tests'
import { minutesToTime } from '../lib/timeUtils'
import {
  fetchVisibilityRules,
  saveEventVisibility,
  saveSubjectVisibility,
} from '../lib/visibilityService'
import useRealtimeSync from '../hooks/useRealtimeSync'
import usePersistentState from '../hooks/usePersistentState'
import useSwipeNavigation from '../hooks/useSwipeNavigation'
import useTestReminders from '../hooks/useTestReminders'
import CustomEvents from '../components/CustomEvents'
import GroupsPanel from '../components/GroupsPanel'
import ImportSchedule from '../components/ImportSchedule'
import OnboardingWizard from '../components/OnboardingWizard'
import OverlayView from '../components/OverlayView'
import QuickEventDialog from '../components/QuickEventDialog'
import QuickLinks from '../components/links/QuickLinks'
import ReorderableList from '../components/ReorderableList'
import SearchModal from '../components/SearchModal'
import SettingsTab from '../components/settings/SettingsTab'
import TabBar from '../components/TabBar'
import TestDialog from '../components/TestDialog'
import TestsTab from '../components/TestsTab'
import ThemeToggle from '../components/ThemeToggle'
import TodayTab from '../components/TodayTab'
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

const ALL_TAB_IDS = TABS.map((item) => item.id)
const PLAN_IDS = ['planGrid', 'customEvents', 'import']

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const { settings, updateSettings, isDark } = useSettings()

  // Tryb edycji układu (ołówek): przeciąganie bloków, zakładek i szybkich linków
  const [editMode, setEditMode] = useState(false)
  const layoutOrder = settings.layoutOrder ?? {}

  const setOrder = (key) => (newOrder) =>
    updateSettings({ layoutOrder: { ...layoutOrder, [key]: newOrder } })

  const resetLayout = () => {
    if (!window.confirm('Przywrócić domyślny układ bloków i zakładek?')) return
    updateSettings({ layoutOrder: {} })
  }

  // Zakładka startowa: ostatnio używana albo wybrana w ustawieniach
  const [lastTab, setLastTab] = usePersistentState('freetime:tab', 'today')
  const [sessionTab, setSessionTab] = useState(() =>
    settings.startTab === 'last' ? lastTab : settings.startTab
  )

  // Zakładki w zapisanej kolejności, bez ukrytych
  const tabOrder = resolveOrder(layoutOrder.tabs, ALL_TAB_IDS)
  const visibleTabs = tabOrder
    .map((id) => TABS.find((item) => item.id === id))
    .filter((item) => item.id === 'settings' || !settings.hiddenTabs.includes(item.id))

  const tab = visibleTabs.some((item) => item.id === sessionTab)
    ? sessionTab
    : visibleTabs[0].id

  const selectTab = (id) => {
    setSessionTab(id)
    setLastTab(id)
  }

  const handleTabsReorder = (newVisibleIds) =>
    setOrder('tabs')(mergeVisibleOrder(tabOrder, newVisibleIds))

  const showPanel = (id) => !settings.hiddenPanels.includes(id)

  const [weekStart, setWeekStart] = useState(defaultWeekStart)
  const [events, setEvents] = useState([])
  const [tests, setTests] = useState([])
  const [rules, setRules] = useState({}) // reguły widoczności przedmiotów dla znajomych
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [offlineNote, setOfflineNote] = useState('')
  const [syncTick, setSyncTick] = useState(0) // zmiana = widoki grup pobierają dane ponownie

  // Okna: dodawanie/edycja sprawdzianu, szybkie wydarzenie z siatki, wyszukiwarka, kreator
  const [dialog, setDialog] = useState(null)
  const [quickDraft, setQuickDraft] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [testsView, setTestsView] = useState('list')

  const name = profile?.display_name ?? user?.email
  const userId = user?.id

  // Przesuwanie palcem między tygodniami i dniami (wyłączone w trybie edycji)
  const mainRef = useRef(null)
  useSwipeNavigation(mainRef, settings.swipeNav && !editMode)

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

  const loadRules = useCallback(async () => {
    if (!userId) return
    try {
      setRules(await fetchVisibilityRules(userId))
    } catch {
      // tabela mogła jeszcze nie powstać (SQL z etapu E) albo brak połączenia
    }
  }, [userId])

  useEffect(() => {
    loadEvents()
    loadTests()
    loadRules()
  }, [loadEvents, loadTests, loadRules])

  // Realtime: zmiany Twoich zajęć i składu grup oraz powrót do karty aplikacji
  useRealtimeSync(userId, () => {
    loadEvents()
    loadTests()
    loadRules()
    setSyncTick((tick) => tick + 1)
  })

  // Przypomnienia o sprawdzianach (dzień przed i w dniu sprawdzianu)
  useTestReminders(tests, {
    enabled: settings.remindersEnabled,
    hour: settings.reminderHour,
  })

  // Skróty klawiszowe: Ctrl+K (Cmd+K) otwiera wyszukiwarkę, Esc kończy tryb edycji
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setEditMode(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

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

  // Kreator pierwszego uruchomienia: otwiera się raz, gdy konto nie ma jeszcze zajęć
  // i kreator nie został ukończony (sprawdzamy też zapis na koncie, bo ustawienia
  // z konta mogą dociągnąć się chwilę później niż profil)
  const wizardCheckedRef = useRef(false)
  useEffect(() => {
    if (wizardCheckedRef.current || loadingEvents || loadError || offlineNote || !profile) return
    wizardCheckedRef.current = true

    const done =
      settings.onboardingDone === true || profile.ui_settings?.onboardingDone === true
    if (!done && events.length === 0) setWizardOpen(true)
  }, [loadingEvents, loadError, offlineNote, profile, events.length, settings.onboardingDone])

  const closeWizard = () => {
    setWizardOpen(false)
    updateSettings({ onboardingDone: true })
  }

  // Sprawdziany jako kafelki do narysowania na planie
  const testEvents = useMemo(() => tests.map(testToEvent), [tests])
  const testsValue = useMemo(() => ({ tests }), [tests])

  // Widoczność zajęć dla znajomych (okno szczegółów zajęć i ustawienia prywatności)
  const setEventVisibility = useCallback(
    async (eventId, value) => {
      await saveEventVisibility(eventId, value)
      await loadEvents()
      setSyncTick((tick) => tick + 1)
    },
    [loadEvents]
  )

  const setSubjectVisibility = useCallback(
    async (subject, value) => {
      await saveSubjectVisibility(userId, subject, value)
      await loadRules()
      setSyncTick((tick) => tick + 1)
    },
    [userId, loadRules]
  )

  const openWizard = useCallback(() => setWizardOpen(true), [])

  const actionsValue = useMemo(
    () => ({ rules, setEventVisibility, setSubjectVisibility, openWizard }),
    [rules, setEventVisibility, setSubjectVisibility, openWizard]
  )

  // Lista przedmiotów (okno sprawdzianu i ustawienia kolorów)
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

  const handleQuickSaved = async () => {
    await loadEvents()
    setQuickDraft(null)
  }

  // Z wyszukiwarki: otwiera "Mój plan" w tygodniu z podaną datą
  const goToDate = (date) => {
    setWeekStart(mondayOf(date))
    selectTab('plan')
    setSearchOpen(false)
  }

  const weekEvents = eventsForWeek(events, weekStart)
  const myLayers = [
    {
      id: userId,
      name: name ?? 'Ja',
      color: getPalette(settings.personPalette)[0],
      applySubjectStyles: true, // własne kolory przedmiotów tylko na własnym planie
      // gdy sprawdziany są kafelkami, kropek nie pokazujemy
      showMarkers: !settings.showTestsOnPlan,
      events: [
        ...weekEvents,
        ...(settings.showTestsOnPlan ? eventsForWeek(testEvents, weekStart) : []),
      ],
    },
  ]

  // Blok "Mój plan (siatka)"
  const planGrid = (
    <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">Mój tygodniowy plan</h2>
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
                Nie masz jeszcze zapisanych zajęć. Zaimportuj plik poniżej albo
                dodaj własne wydarzenie.
              </p>
            )}
            {events.length > 0 && weekEvents.length === 0 && (
              <p className="text-sm text-slate-500">
                W tym tygodniu nie masz zajęć. Użyj strzałek, aby przejść do
                innego tygodnia.
              </p>
            )}
            <WeekGrid
              layers={myLayers}
              weekStart={weekStart}
              onLongPress={({ event, date }) => openDialog(draftFromTile(event, date))}
              onEditTest={openTestById}
              onCreateRange={({ date, startMin, endMin }) =>
                setQuickDraft({
                  date,
                  start: minutesToTime(startMin),
                  end: minutesToTime(endMin),
                })
              }
            />
          </div>
        )}
      </div>
    </section>
  )

  return (
    <ActionsContext.Provider value={actionsValue}>
      <TestsContext.Provider value={testsValue}>
        <div className="min-h-screen">
          <header className="app-header shadow-sm">
            <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2 md:shrink-0">
                <CalendarClock className="logo-icon h-6 w-6 shrink-0 text-indigo-600" />
                <span className="truncate text-lg font-bold text-slate-800">
                  USOS FreeTime
                </span>
              </div>

              {/* Szybkie linki: pasek na komputerze, przycisk z szufladą na telefonie */}
              <div className="flex min-w-0 flex-1 items-center">
                <QuickLinks editing={editMode} />
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="hidden text-sm text-slate-600 lg:inline">{name}</span>
                <button
                  onClick={() => setEditMode((value) => !value)}
                  className={`flex items-center gap-1.5 rounded-lg border p-2 text-sm transition ${
                    editMode
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-label={editMode ? 'Zakończ edycję układu' : 'Edytuj układ'}
                  title={editMode ? 'Zakończ edycję układu' : 'Edytuj układ (przeciąganie bloków)'}
                >
                  {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100"
                  aria-label="Szukaj"
                  title="Szukaj (Ctrl+K)"
                >
                  <Search className="h-4 w-4" />
                </button>
                <ThemeToggle />
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 p-2 text-sm text-slate-700 transition hover:bg-slate-100 sm:px-3 sm:py-1.5"
                  aria-label="Wyloguj"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Wyloguj</span>
                </button>
              </div>
            </div>

            <TabBar
              tabs={visibleTabs}
              activeId={tab}
              onSelect={selectTab}
              editing={editMode}
              onReorder={handleTabsReorder}
            />
          </header>

          <main ref={mainRef} className="mx-auto max-w-5xl p-4 sm:p-6">
            {editMode && (
              <div className="modal-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-indigo-400 bg-indigo-50 px-4 py-3 text-sm text-slate-700">
                <p className="min-w-0 flex-1">
                  <strong className="text-indigo-600">Tryb edycji układu.</strong>{' '}
                  Przeciągaj bloki za uchwyt z nazwą, zakładki oraz przyciski
                  szybkich linków u góry (ołówek przy przycisku edytuje go, a plus
                  dodaje nowy). Układ zapisuje się na koncie.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={resetLayout}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-100"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Domyślny układ
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <Check className="h-4 w-4" />
                    Gotowe
                  </button>
                </div>
              </div>
            )}

            {offlineNote && (
              <p className="mb-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {offlineNote}
              </p>
            )}

            <div key={tab} className="stagger flex flex-col gap-6">
              {tab === 'today' && (
                <TodayTab
                  syncTick={syncTick}
                  tests={tests}
                  onOpenTest={openTest}
                  editing={editMode}
                  order={layoutOrder.today}
                  onReorder={setOrder('today')}
                />
              )}

              {tab === 'plan' && (
                <ReorderableList
                  id="plan"
                  allIds={PLAN_IDS}
                  order={layoutOrder.plan}
                  editing={editMode}
                  onReorder={setOrder('plan')}
                  items={[
                    { id: 'planGrid', label: 'Mój plan (siatka)', node: planGrid },
                    {
                      id: 'customEvents',
                      label: 'Własne wydarzenia',
                      node: showPanel('customEvents') ? (
                        <CustomEvents events={events} onChanged={loadEvents} />
                      ) : null,
                    },
                    {
                      id: 'import',
                      label: 'Import planu',
                      node: showPanel('import') ? (
                        <ImportSchedule onImported={loadEvents} existing={events} />
                      ) : null,
                    },
                  ]}
                />
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

              {tab === 'overlay' && (
                <OverlayView
                  syncTick={syncTick}
                  editing={editMode}
                  order={layoutOrder.overlay}
                  onReorder={setOrder('overlay')}
                />
              )}

              {tab === 'settings' && (
                <SettingsTab subjects={subjects} onDataChanged={loadEvents} />
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

          {quickDraft && (
            <QuickEventDialog
              initial={quickDraft}
              events={events}
              onClose={() => setQuickDraft(null)}
              onSaved={handleQuickSaved}
            />
          )}

          {searchOpen && (
            <SearchModal
              events={events}
              tests={tests}
              onClose={() => setSearchOpen(false)}
              onGoToDate={goToDate}
              onOpenTest={(test) => {
                setSearchOpen(false)
                openTest(test)
              }}
            />
          )}

          {wizardOpen && (
            <OnboardingWizard
              events={events}
              onImported={loadEvents}
              onGroupsChanged={() => setSyncTick((tick) => tick + 1)}
              onClose={closeWizard}
            />
          )}
        </div>
      </TestsContext.Provider>
    </ActionsContext.Provider>
  )
}