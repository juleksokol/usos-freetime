import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
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
  const [nickname, setNickname] = useState(null) // null = nie edytowano
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const value = nickname ?? profile?.display_name ?? ''

  const save = async (e) => {
    e.preventDefault()

    const name = value.trim()
    if (name.length < 1 || name.length > 40) {
      setMessage('Pseudonim musi mieć od 1 do 40 znaków.')
      return
    }

    setSaving(true)
    try {
      await updateProfile(user.id, { display_name: name })
      await refreshProfile()
      setNickname(null)
      setMessage('Zapisano pseudonim.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-3">
      <p className="text-sm text-slate-500">
        Pseudonim widzą znajomi z grup (także jako znak wodny na zajęciach).
      </p>
      <form onSubmit={save} className="mt-3 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={40}
          className={`${selectClass} min-w-0 flex-1`}
        />
        <button
          type="submit"
          disabled={saving || nickname === null}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Zapisz
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
    </div>
  )
}

// Prywatność: czy znajomi widzą szczegóły zajęć
export function PrivacyBody() {
  const { user, profile, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const shareDetails = profile?.share_details ?? true

  const toggle = async (next) => {
    setBusy(true)
    try {
      await updateProfile(user.id, { share_details: next })
      await refreshProfile()
      setMessage(
        next
          ? 'Znajomi widzą teraz szczegóły Twoich zajęć.'
          : 'Znajomi widzą teraz tylko, że jesteś zajęty.'
      )
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Row
        label="Pokazuj znajomym szczegóły moich zajęć"
        hint="Po wyłączeniu znajomi z Twoich grup zobaczą tylko blok „Zajęty” z godzinami, bez nazwy przedmiotu, sali i prowadzącego."
      >
        <Switch
          checked={shareDetails}
          onChange={toggle}
          disabled={busy || !profile}
          label="Pokazuj szczegóły znajomym"
        />
      </Row>
      {message && <p className="py-3 text-sm text-slate-600">{message}</p>}
    </>
  )
}

// Eksport danych (JSON i kalendarz .ics) oraz link do polityki prywatności
export function ExportBody() {
  const { user, profile } = useAuth()
  const { settings } = useSettings()
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

      setInfo('Plik został pobrany.')
    } catch (err) {
      setInfo(`Nie udało się wyeksportować danych: ${err.message}`)
    } finally {
      setExporting('')
    }
  }

  return (
    <>
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

      {info && <p className="py-3 text-sm text-slate-600">{info}</p>}
    </>
  )
}

// Powrót do domyślnych ustawień interfejsu
export function ResetBody() {
  const { resetSettings } = useSettings()
  const [done, setDone] = useState(false)

  const reset = () => {
    if (!window.confirm('Przywrócić wszystkie ustawienia interfejsu do domyślnych?')) return
    resetSettings()
    setDone(true)
  }

  return (
    <>
      <Row
        label="Przywróć domyślne ustawienia interfejsu"
        hint="Nie usuwa Twojego planu ani grup. Układ bloków przywrócisz osobno w sekcji „Układ aplikacji”."
      >
        <button onClick={reset} className={buttonClass}>
          Przywróć
        </button>
      </Row>
      {done && (
        <p className="py-3 text-sm text-slate-600">Przywrócono ustawienia domyślne.</p>
      )}
    </>
  )
}

// Usuwanie planu i konta
export function DangerBody({ onDataChanged }) {
  const { user, signOut } = useAuth()
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const deletePlan = async () => {
    if (
      !window.confirm(
        'Usunąć cały Twój plan (zaimportowany i własne wydarzenia)? Tej operacji nie można cofnąć.'
      )
    ) {
      return
    }

    setBusy('plan')
    try {
      await deleteAllMyEvents(user.id)
      await onDataChanged?.()
      setMessage('Usunięto wszystkie Twoje zajęcia.')
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
      <Row label="Usuń cały mój plan" hint="Zaimportowany plan i własne wydarzenia.">
        <button
          onClick={deletePlan}
          disabled={busy === 'plan'}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          Usuń mój plan
        </button>
      </Row>

      <div className="py-3">
        <p className="text-sm text-slate-600">
          Usunięcie konta kasuje Twój profil, plan i członkostwa. Grupy, których
          jesteś właścicielem, zostaną usunięte dla wszystkich ich członków.
          Tej operacji nie można cofnąć.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Wpisz USUŃ, aby potwierdzić"
            className={`${selectClass} min-w-0 flex-1`}
          />
          <button
            onClick={deleteAccount}
            disabled={busy === 'account' || confirmText.trim().toUpperCase() !== 'USUŃ'}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === 'account' && <Loader2 className="h-4 w-4 animate-spin" />}
            Usuń konto
          </button>
        </div>
      </div>

      {message && <p className="py-3 text-sm text-slate-600">{message}</p>}
    </>
  )
}