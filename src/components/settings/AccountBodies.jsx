import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { useSettings } from '../../context/SettingsContext'
import { deleteMyAccount, updateProfile } from '../../lib/accountService'
import { todayISO } from '../../lib/dateUtils'
import { buildIcs, buildJsonExport, downloadFile } from '../../lib/exportData'
import { deleteAllMyEvents, fetchUserSchedule } from '../../lib/scheduleService'
import { fetchTests } from '../../lib/testService'
import { Row, Switch, selectClass } from './controls'

const buttonClass =
  'rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60'

// Profil: zmiana pseudonimu
export function ProfileBody() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useI18n()
  const [nickname, setNickname] = useState(null) // null = nie edytowano
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const value = nickname ?? profile?.display_name ?? ''

  const save = async (e) => {
    e.preventDefault()

    const name = value.trim()
    if (name.length < 1 || name.length > 40) {
      setMessage(t('settings.profile.length'))
      return
    }

    setSaving(true)
    try {
      await updateProfile(user.id, { display_name: name })
      await refreshProfile()
      setNickname(null)
      setMessage(t('settings.profile.saved'))
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-3">
      <p className="text-sm text-slate-500">{t('settings.profile.intro')}</p>
      <form onSubmit={save} className="mt-3 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={40}
          aria-label={t('settings.profile.field')}
          className={`${selectClass} min-w-0 flex-1`}
        />
        <button
          type="submit"
          disabled={saving || nickname === null}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('settings.profile.save')}
        </button>
      </form>
      {message && (
        <p role="status" className="mt-2 text-sm text-slate-600">
          {message}
        </p>
      )}
    </div>
  )
}

// Prywatność: czy znajomi widzą szczegóły zajęć
export function PrivacyBody() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const shareDetails = profile?.share_details ?? true

  const toggle = async (next) => {
    setBusy(true)
    try {
      await updateProfile(user.id, { share_details: next })
      await refreshProfile()
      setMessage(next ? t('settings.privacy.on') : t('settings.privacy.off'))
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Row label={t('settings.privacy.label')} hint={t('settings.privacy.hint')}>
        <Switch
          checked={shareDetails}
          onChange={toggle}
          disabled={busy || !profile}
          label={t('settings.privacy.switch')}
        />
      </Row>
      {message && (
        <p role="status" className="py-3 text-sm text-slate-600">
          {message}
        </p>
      )}
    </>
  )
}

// Eksport danych (JSON i kalendarz .ics) oraz link do polityki prywatności
export function ExportBody() {
  const { user, profile } = useAuth()
  const { settings } = useSettings()
  const { t } = useI18n()
  const [exporting, setExporting] = useState('')
  const [info, setInfo] = useState('')

  const exportData = async (kind) => {
    if (!user) return

    setExporting(kind)
    setInfo('')

    try {
      const [events, tests] = await Promise.all([
        fetchUserSchedule(user.id),
        fetchTests(user.id),
      ])
      const stamp = todayISO()

      if (kind === 'json') {
        const data = buildJsonExport({ email: user.email, profile, events, tests, settings })
        downloadFile(
          `usos-freetime-${stamp}.json`,
          JSON.stringify(data, null, 2),
          'application/json'
        )
      } else {
        downloadFile(`usos-freetime-${stamp}.ics`, buildIcs(events, tests), 'text/calendar')
      }

      setInfo(t('settings.export.done'))
    } catch (err) {
      setInfo(t('settings.export.failed', { message: err.message }))
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <Row label={t('settings.export.jsonLabel')} hint={t('settings.export.jsonHint')}>
        <button
          onClick={() => exportData('json')}
          disabled={exporting !== ''}
          className={buttonClass}
        >
          {exporting === 'json' ? t('settings.export.downloading') : t('settings.export.jsonButton')}
        </button>
      </Row>

      <Row label={t('settings.export.icsLabel')} hint={t('settings.export.icsHint')}>
        <button
          onClick={() => exportData('ics')}
          disabled={exporting !== ''}
          className={buttonClass}
        >
          {exporting === 'ics' ? t('settings.export.downloading') : t('settings.export.icsButton')}
        </button>
      </Row>

      <Row label={t('settings.export.privacyLabel')}>
        <a
          href="#/prywatnosc"
          className="text-sm text-indigo-700 underline-offset-2 hover:underline"
        >
          {t('settings.export.open')}
        </a>
      </Row>

      {info && (
        <p role="status" className="py-3 text-sm text-slate-600">
          {info}
        </p>
      )}
    </>
  )
}

// Powrót do domyślnych ustawień interfejsu
export function ResetBody() {
  const { resetSettings } = useSettings()
  const { t } = useI18n()
  const [done, setDone] = useState(false)

  const reset = () => {
    if (!window.confirm(t('settings.reset.confirm'))) return
    resetSettings()
    setDone(true)
  }

  return (
    <>
      <Row label={t('settings.reset.label')} hint={t('settings.reset.hint')}>
        <button onClick={reset} className={buttonClass}>
          {t('settings.reset.button')}
        </button>
      </Row>
      {done && (
        <p role="status" className="py-3 text-sm text-slate-600">
          {t('settings.reset.done')}
        </p>
      )}
    </>
  )
}

// Usuwanie planu i konta
export function DangerBody({ onDataChanged }) {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const deletePlan = async () => {
    if (!window.confirm(t('settings.danger.planConfirm'))) return

    setBusy('plan')
    try {
      await deleteAllMyEvents(user.id)
      await onDataChanged?.()
      setMessage(t('settings.danger.planDone'))
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy('')
    }
  }

  const deleteAccount = async () => {
    setBusy('account')
    try {
      await deleteMyAccount()
      await signOut()
    } catch (err) {
      setMessage(err.message)
      setBusy('')
    }
  }

  return (
    <>
      <Row label={t('settings.danger.planLabel')} hint={t('settings.danger.planHint')}>
        <button
          onClick={deletePlan}
          disabled={busy === 'plan'}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          {t('settings.danger.planButton')}
        </button>
      </Row>

      <div className="py-3">
        <p className="text-sm text-slate-600">{t('settings.danger.accountText')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t('settings.danger.placeholder')}
            aria-label={t('settings.danger.placeholder')}
            className={`${selectClass} min-w-0 flex-1`}
          />
          <button
            onClick={deleteAccount}
            disabled={
              busy === 'account' || confirmText.trim().toUpperCase() !== t('settings.danger.word')
            }
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === 'account' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {t('settings.danger.accountButton')}
          </button>
        </div>
      </div>

      {message && (
        <p role="status" className="py-3 text-sm text-slate-600">
          {message}
        </p>
      )}
    </>
  )
}
