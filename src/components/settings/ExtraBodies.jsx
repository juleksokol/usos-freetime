import { useState } from 'react'
import { useI18n } from '../../context/I18nContext'
import { useSettings } from '../../context/SettingsContext'
import { PANEL_META, TAB_LABEL_KEYS } from '../../lib/labelKeys'
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
  const { t } = useI18n()

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
    if (!window.confirm(t('settings.layout.resetConfirm'))) return
    updateSettings({ layoutOrder: {} })
  }

  return (
    <>
      <p className="py-3 text-sm text-slate-500">{t('settings.layout.intro')}</p>

      <SubHeading>{t('settings.layout.tabs')}</SubHeading>
      {TAB_OPTIONS.map((tab) => {
        const name = t(TAB_LABEL_KEYS[tab.id])

        return (
          <Row key={tab.id} label={name}>
            <Switch
              checked={!settings.hiddenTabs.includes(tab.id)}
              onChange={(visible) => setVisible('hiddenTabs', tab.id, visible)}
              label={t('settings.layout.showTab', { name })}
            />
          </Row>
        )
      })}

      <SubHeading>{t('settings.layout.panels')}</SubHeading>
      {PANEL_OPTIONS.map((panel) => {
        const meta = PANEL_META[panel.id]
        const name = t(meta.label)

        return (
          <Row key={panel.id} label={name} hint={t(meta.where, { tab: t(meta.tab) })}>
            <Switch
              checked={!settings.hiddenPanels.includes(panel.id)}
              onChange={(visible) => setVisible('hiddenPanels', panel.id, visible)}
              label={t('settings.layout.showPanel', { name })}
            />
          </Row>
        )
      })}

      <Row label={t('settings.layout.resetLabel')} hint={t('settings.layout.resetHint')}>
        <button onClick={resetLayout} className={buttonClass}>
          {t('settings.layout.resetButton')}
        </button>
      </Row>
    </>
  )
}

const PERMISSION_KEYS = {
  granted: 'settings.notif.granted',
  denied: 'settings.notif.denied',
  default: 'settings.notif.default',
  unsupported: 'settings.notif.unsupported',
}

// Powiadomienia systemowe: uprawnienie i wysłanie próbnego powiadomienia
export function NotificationsExtras() {
  const { t } = useI18n()
  const [permission, setPermission] = useState(notificationPermission)
  const [info, setInfo] = useState('')

  const askPermission = async () => {
    setPermission(await requestNotificationPermission())
  }

  const sendTest = async () => {
    const shown = await showLocalNotification('USOS FreeTime', {
      body: t('settings.notif.body'),
    })
    setInfo(shown ? t('settings.notif.sent') : t('settings.notif.failed'))
  }

  return (
    <>
      <Row
        label={t('settings.notif.label')}
        hint={t('settings.notif.state', {
          state: t(PERMISSION_KEYS[permission] ?? PERMISSION_KEYS.default),
        })}
      >
        <div className="flex flex-wrap gap-2">
          {permission === 'default' && (
            <button
              onClick={askPermission}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {t('settings.notif.enable')}
            </button>
          )}
          {permission === 'granted' && (
            <button onClick={sendTest} className={buttonClass}>
              {t('settings.notif.test')}
            </button>
          )}
        </div>
      </Row>
      {info && <p className="py-3 text-sm text-slate-600">{info}</p>}
    </>
  )
}
