import { useState } from 'react'
import { Bell, BellOff, ClipboardList, Plus } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { formatLongDate, todayISO } from '../lib/dateUtils'
import {
  notificationPermission,
  requestNotificationPermission,
} from '../lib/notifications'
import {
  TEST_KIND_ORDER,
  TEST_KINDS,
  blankTest,
  countdownLabel,
  daysUntil,
  draftFromTile,
  shortMonth,
  sortTests,
  testDisplayName,
  testKind,
  testToDraft,
} from '../lib/tests'
import TestPicker from './TestPicker'

function TestCard({ test, onOpen, past = false }) {
  const kind = testKind(test)
  const day = Number(test.test_date.split('-')[2])
  const days = daysUntil(test.test_date)

  return (
    <button
      type="button"
      onClick={() => onOpen(test)}
      className={`flex w-full items-stretch gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
        past ? 'opacity-70' : ''
      }`}
      style={{ borderLeft: `5px solid ${kind.color}` }}
    >
      <div
        className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg"
        style={{ backgroundColor: `${kind.color}1f`, color: kind.color }}
      >
        <span className="text-xl font-extrabold leading-none">{day}</span>
        <span className="mt-0.5 text-xs font-semibold uppercase">
          {shortMonth(test.test_date)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-slate-800">
            {test.subject}
          </span>
          {test.reminder && <Bell className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
        </div>
        <div className="text-sm text-slate-500">
          {testDisplayName(test)} · {formatLongDate(test.test_date)} ·{' '}
          {test.start_time.slice(0, 5)}–{test.end_time.slice(0, 5)}
          {test.location ? ` · ${test.location}` : ''}
        </div>
        {test.notes && (
          <div className="mt-1 line-clamp-2 text-sm text-slate-600">
            {test.notes}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-1">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: `${kind.color}22`, color: kind.color }}
        >
          {countdownLabel(days)}
        </span>
        {test.result && (
          <span className="text-xs font-medium text-slate-600">{test.result}</span>
        )}
      </div>
    </button>
  )
}

export default function TestsTab({
  view,
  setView,
  tests,
  events,
  onOpenDialog,
}) {
  const { settings } = useSettings()
  const [permission, setPermission] = useState(notificationPermission)

  const today = todayISO()
  const upcoming = tests.filter((test) => test.test_date >= today).sort(sortTests)
  const past = tests
    .filter((test) => test.test_date < today)
    .sort((a, b) => sortTests(b, a))

  const openTest = (test) => onOpenDialog(testToDraft(test))

  const enableNotifications = async () => {
    setPermission(await requestNotificationPermission())
  }

  if (view === 'picker') {
    return (
      <TestPicker
        events={events}
        onBack={() => setView('list')}
        onManual={() => onOpenDialog(blankTest())}
        onPick={({ event, date }) => onOpenDialog(draftFromTile(event, date))}
      />
    )
  }

  const showBanner = settings.remindersEnabled && permission !== 'granted'

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              Kolokwia i egzaminy
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Nadchodzące: {upcoming.length}
              {past.length > 0 && ` · minione: ${past.length}`}. Widzisz je
              tylko Ty.
            </p>
          </div>

          <button
            onClick={() => setView('picker')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Dodaj
          </button>
        </div>
      </section>

      {showBanner && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <BellOff className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {permission === 'default' &&
                `Włącz powiadomienia, a przypomnę o sprawdzianie dzień przed (od ${settings.reminderHour}:00), gdy aplikacja jest otwarta lub działa w tle.`}
              {permission === 'denied' &&
                'Powiadomienia są zablokowane w ustawieniach przeglądarki. Odblokuj je dla tej strony, żeby dostawać przypomnienia.'}
              {permission === 'unsupported' &&
                'Ta przeglądarka nie obsługuje powiadomień. Na iPhonie dodaj aplikację do ekranu początkowego i otwórz ją stamtąd.'}
            </span>
          </div>
          {permission === 'default' && (
            <button
              onClick={enableNotifications}
              className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white transition hover:bg-amber-700"
            >
              Włącz powiadomienia
            </button>
          )}
        </section>
      )}

      {tests.length === 0 ? (
        <button
          onClick={() => setView('picker')}
          className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-14 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition group-hover:scale-110">
            <Plus className="h-8 w-8" />
          </span>
          <span className="text-base font-semibold text-slate-800">
            Dodaj pierwsze kolokwium lub egzamin
          </span>
          <span className="text-sm text-slate-500">
            Wybierzesz zajęcia z planu, a ja uzupełnię przedmiot, datę i
            godziny.
          </span>
        </button>
      ) : (
        <>
          {TEST_KIND_ORDER.map((kindId) => {
            const list = upcoming.filter((test) => test.kind === kindId)
            if (list.length === 0) return null

            const kind = TEST_KINDS[kindId]

            return (
              <section key={kindId} className="flex flex-col gap-3">
                <h3
                  className="flex items-center gap-2 text-base font-semibold"
                  style={{ color: kind.color }}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: kind.color }}
                  />
                  {kind.plural} ({list.length})
                </h3>
                <div className="stagger flex flex-col gap-2">
                  {list.map((test) => (
                    <TestCard key={test.id} test={test} onOpen={openTest} />
                  ))}
                </div>
              </section>
            )
          })}

          {upcoming.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
              Brak nadchodzących sprawdzianów.
            </p>
          )}

          {past.length > 0 && (
            <details className="rounded-2xl bg-white p-4 shadow sm:p-6">
              <summary className="cursor-pointer text-base font-semibold text-slate-700">
                Minione ({past.length})
              </summary>
              <div className="mt-3 flex flex-col gap-2">
                {past.map((test) => (
                  <TestCard key={test.id} test={test} onOpen={openTest} past />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* Plus zawsze widoczny */}
      <button
        onClick={() => setView('picker')}
        className="fab-pulse fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl transition hover:scale-110 hover:bg-indigo-700"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Dodaj sprawdzian"
        title="Dodaj sprawdzian"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  )
}