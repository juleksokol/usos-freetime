import { useState } from 'react'
import { Bell, Download, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { todayISO } from '../lib/dateUtils'
import { buildIcs, buildJsonExport, downloadFile } from '../lib/exportData'
import {
  notificationPermission,
  requestNotificationPermission,
  showLocalNotification,
} from '../lib/notifications'
import { fetchUserSchedule } from '../lib/scheduleService'
import { fetchTests } from '../lib/testService'
import { Row, Section, Switch, selectClass } from './SettingsControls'

const REMINDER_HOURS = [12, 14, 16, 17, 18, 19, 20, 21, 22]

const PERMISSION_LABELS = {
  granted: 'Włączone',
  denied: 'Zablokowane w przeglądarce',
  default: 'Jeszcze nie włączone',
  unsupported: 'Niedostępne w tej przeglądarce',
}

export default function ExtraSettings() {
  const { user, profile } = useAuth()
  const { settings, updateSettings } = useSettings()
  const [permission, setPermission] = useState(notificationPermission)
  const [info, setInfo] = useState('')
  const [exporting, setExporting] = useState('')
  const [exportInfo, setExportInfo] = useState('')

  const set = (key) => (value) => updateSettings({ [key]: value })

  const askPermission = async () => {
    setPermission(await requestNotificationPermission())
  }

  const sendTest = async () => {
    const shown = await showLocalNotification('USOS FreeTime', {
      body: 'Powiadomienia działają. Przypomnę Ci o sprawdzianach.',
    })
    setInfo(
      shown
        ? 'Wysłano testowe powiadomienie.'
        : 'Nie udało się wysłać powiadomienia. Sprawdź uprawnienia przeglądarki.'
    )
  }

  // Pobiera aktualne dane z bazy i zapisuje je do pliku
  const exportData = async (kind) => {
    if (!user) return

    setExporting(kind)
    setExportInfo('')

    try {
      const [events, tests] = await Promise.all([
        fetchUserSchedule(user.id),
        fetchTests(user.id),
      ])
      const stamp = todayISO()

      if (kind === 'json') {
        const data = buildJsonExport({
          email: user.email,
          profile,
          events,
          tests,
          settings,
        })
        downloadFile(
          `usos-freetime-${stamp}.json`,
          JSON.stringify(data, null, 2),
          'application/json'
        )
      } else {
        downloadFile(`usos-freetime-${stamp}.ics`, buildIcs(events, tests), 'text/calendar')
      }

      setExportInfo('Plik został pobrany.')
    } catch (err) {
      setExportInfo(`Nie udało się wyeksportować danych: ${err.message}`)
    } finally {
      setExporting('')
    }
  }

  const buttonClass =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60'

  return (
    <>
      <Section
        icon={Sparkles}
        title="Animacje i efekty"
        description="Płynne przejścia, animowany licznik i efekty po najechaniu."
      >
        <Row
          label="Animacje"
          hint="Wyłączenie ułatwia pracę na wolniejszych urządzeniach. Szanujemy też systemowe „ogranicz ruch”."
        >
          <Switch
            checked={settings.animations}
            onChange={set('animations')}
            label="Animacje"
          />
        </Row>
      </Section>

      <Section
        icon={Bell}
        title="Kolokwia i powiadomienia"
        description="Jak pokazywać sprawdziany i kiedy o nich przypominać."
      >
        <Row
          label="Sprawdziany na moim planie"
          hint="Kolorowe kafelki (egzamin czerwony, kolokwium pomarańczowe, reszta zielona). Po wyłączeniu zobaczysz je jako kropki na zajęciach."
        >
          <Switch
            checked={settings.showTestsOnPlan}
            onChange={set('showTestsOnPlan')}
            label="Sprawdziany na moim planie"
          />
        </Row>

        <Row
          label="Kropki sprawdzianów na wspólnym planie"
          hint="Mała kropka w rogu zajęć z przedmiotu, z którego masz w tym tygodniu sprawdzian. Widzisz ją tylko Ty."
        >
          <Switch
            checked={settings.showExamDots}
            onChange={set('showExamDots')}
            label="Kropki sprawdzianów"
          />
        </Row>

        <Row
          label="Przypomnienia o sprawdzianach"
          hint="Dzień przed od wybranej godziny oraz rano w dniu sprawdzianu, gdy aplikacja jest otwarta lub działa w tle."
        >
          <Switch
            checked={settings.remindersEnabled}
            onChange={set('remindersEnabled')}
            label="Przypomnienia"
          />
        </Row>

        <Row label="Godzina przypomnienia dzień przed">
          <select
            value={settings.reminderHour}
            onChange={(e) => updateSettings({ reminderHour: Number(e.target.value) })}
            className={selectClass}
          >
            {REMINDER_HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}:00
              </option>
            ))}
          </select>
        </Row>

        <Row
          label="Powiadomienia systemowe"
          hint={`Stan: ${PERMISSION_LABELS[permission] ?? permission}.`}
        >
          <div className="flex flex-wrap justify-end gap-2">
            {permission === 'default' && (
              <button
                onClick={askPermission}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Włącz
              </button>
            )}
            {permission === 'granted' && (
              <button onClick={sendTest} className={buttonClass}>
                Wyślij test
              </button>
            )}
          </div>
        </Row>

        {info && <p className="py-3 text-sm text-slate-600">{info}</p>}
      </Section>

      <Section
        icon={Download}
        title="Eksport danych i prywatność"
        description="Kopia Twoich danych oraz informacje o ich przetwarzaniu."
      >
        <Row
          label="Wszystkie dane (JSON)"
          hint="Konto, plan, własne wydarzenia, sprawdziany i ustawienia."
        >
          <button
            onClick={() => exportData('json')}
            disabled={exporting !== ''}
            className={buttonClass}
          >
            {exporting === 'json' ? 'Pobieranie…' : 'Pobierz JSON'}
          </button>
        </Row>

        <Row
          label="Kalendarz (.ics)"
          hint="Zajęcia, własne wydarzenia i sprawdziany do wczytania w Google Calendar, Outlooku lub kalendarzu iPhone'a. Sprawdziany mają alarm dzień przed."
        >
          <button
            onClick={() => exportData('ics')}
            disabled={exporting !== ''}
            className={buttonClass}
          >
            {exporting === 'ics' ? 'Pobieranie…' : 'Pobierz .ics'}
          </button>
        </Row>

        <Row label="Polityka prywatności">
          <a
            href="#/prywatnosc"
            className="text-sm text-indigo-600 underline-offset-2 hover:underline"
          >
            Otwórz
          </a>
        </Row>

        {exportInfo && <p className="py-3 text-sm text-slate-600">{exportInfo}</p>}
      </Section>
    </>
  )
}