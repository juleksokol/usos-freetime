import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import {
  notificationPermission,
  requestNotificationPermission,
  showLocalNotification,
} from '../../lib/notifications'
import { PANEL_OPTIONS, TAB_OPTIONS } from '../../lib/settingsDefaults'
import { Row, SubHeading, Switch } from './controls'

const buttonClass =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100'

// Układ aplikacji: widoczność zakładek i paneli oraz powrót do domyślnej kolejności
export function LayoutExtras() {
  const { settings, updateSettings } = useSettings()

  // Przełączanie widoczności zakładek i paneli (lista ukrytych elementów)
  const setVisible = (listKey, id, visible) => {
    const list = settings[listKey]
    updateSettings({
      [listKey]: visible
        ? list.filter((item) => item !== id)
        : list.includes(id)
          ? list
          : [...list, id],
    })
  }

  const resetLayout = () => {
    if (!window.confirm('Przywrócić domyślny układ bloków i zakładek?')) return
    updateSettings({ layoutOrder: {} })
  }

  return (
    <>
      <p className="py-3 text-sm text-slate-500">
        Kolejność bloków i zakładek zmienisz ołówkiem w nagłówku aplikacji
        (przeciąganie).
      </p>

      <SubHeading>Zakładki</SubHeading>
      {TAB_OPTIONS.map((tab) => (
        <Row key={tab.id} label={tab.label}>
          <Switch
            checked={!settings.hiddenTabs.includes(tab.id)}
            onChange={(visible) => setVisible('hiddenTabs', tab.id, visible)}
            label={`Pokaż zakładkę ${tab.label}`}
          />
        </Row>
      ))}

      <SubHeading>Panele</SubHeading>
      {PANEL_OPTIONS.map((panel) => (
        <Row key={panel.id} label={panel.label} hint={panel.hint}>
          <Switch
            checked={!settings.hiddenPanels.includes(panel.id)}
            onChange={(visible) => setVisible('hiddenPanels', panel.id, visible)}
            label={`Pokaż panel ${panel.label}`}
          />
        </Row>
      ))}

      <Row
        label="Przywróć domyślny układ"
        hint="Kolejność bloków i zakładek wraca do ustawień fabrycznych."
      >
        <button onClick={resetLayout} className={buttonClass}>
          Przywróć
        </button>
      </Row>
    </>
  )
}

const PERMISSION_LABELS = {
  granted: 'Włączone',
  denied: 'Zablokowane w przeglądarce',
  default: 'Jeszcze nie włączone',
  unsupported: 'Niedostępne w tej przeglądarce',
}

// Powiadomienia systemowe: uprawnienie i wysłanie próbnego powiadomienia
export function NotificationsExtras() {
  const [permission, setPermission] = useState(notificationPermission)
  const [info, setInfo] = useState('')

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
      <Row
        label="Powiadomienia systemowe"
        hint={`Stan: ${PERMISSION_LABELS[permission] ?? permission}.`}
      >
        <div className="flex flex-wrap gap-2">
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
    </>
  )
}