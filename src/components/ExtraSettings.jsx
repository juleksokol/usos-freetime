import { useState } from 'react'
import { Bell, Sparkles } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import {
  notificationPermission,
  requestNotificationPermission,
  showLocalNotification,
} from '../lib/notifications'
import { Row, Section, Switch, selectClass } from './SettingsControls'

const REMINDER_HOURS = [12, 14, 16, 17, 18, 19, 20, 21, 22]

const PERMISSION_LABELS = {
  granted: 'Włączone',
  denied: 'Zablokowane w przeglądarce',
  default: 'Jeszcze nie włączone',
  unsupported: 'Niedostępne w tej przeglądarce',
}

export default function ExtraSettings() {
  const { settings, updateSettings } = useSettings()
  const [permission, setPermission] = useState(notificationPermission)
  const [info, setInfo] = useState('')

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
              <button
                onClick={sendTest}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Wyślij test
              </button>
            )}
          </div>
        </Row>

        {info && <p className="py-3 text-sm text-slate-600">{info}</p>}
      </Section>
    </>
  )
}