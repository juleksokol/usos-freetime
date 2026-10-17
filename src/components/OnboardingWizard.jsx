import { useState } from 'react'
import { Bell, Check, Copy, FileSpreadsheet, Loader2, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { updateProfile } from '../lib/accountService'
import { createGroup, joinGroupByCode } from '../lib/groupService'
import {
  notificationPermission,
  requestNotificationPermission,
} from '../lib/notifications'
import ImportSchedule from './ImportSchedule'
import { Row, Switch, selectClass } from './settings/controls'

const STEPS = [
  { id: 'plan', label: 'Plan', icon: FileSpreadsheet },
  { id: 'group', label: 'Grupa', icon: Users },
  { id: 'alerts', label: 'Powiadomienia', icon: Bell },
]

const PERMISSION_TEXT = {
  granted: 'Powiadomienia są włączone.',
  denied: 'Powiadomienia są zablokowane w ustawieniach przeglądarki.',
  default: 'Powiadomienia nie są jeszcze włączone.',
  unsupported:
    'Ta przeglądarka nie obsługuje powiadomień (na iPhonie dodaj aplikację do ekranu początkowego).',
}

const buttonClass =
  'rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60'
const primaryClass =
  'flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Kreator pierwszego uruchomienia: import planu, grupa, powiadomienia.
 * events:          aktualne zajęcia użytkownika (do podglądu zmian przy imporcie)
 * onImported:      odświeżenie planu po imporcie
 * onGroupsChanged: odświeżenie widoków grup po dołączeniu lub utworzeniu grupy
 * onClose:         zamknięcie kreatora (zapamiętuje, że został ukończony lub pominięty)
 */
export default function OnboardingWizard({ events, onImported, onGroupsChanged, onClose }) {
  const { user, profile, refreshProfile } = useAuth()
  const { settings, updateSettings } = useSettings()

  const [step, setStep] = useState(0) // 0-2 kroki, 3 podsumowanie

  // Krok 2: grupa
  const [mode, setMode] = useState('join') // 'join' | 'create'
  const [code, setCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [joined, setJoined] = useState(false)
  const [createdCode, setCreatedCode] = useState('')
  const [groupMessage, setGroupMessage] = useState('')
  const [groupError, setGroupError] = useState('')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState(false)

  // Krok 3: powiadomienia i prywatność
  const [permission, setPermission] = useState(notificationPermission)
  const [privacyBusy, setPrivacyBusy] = useState(false)
  const [privacyError, setPrivacyError] = useState('')

  const planCount = events.filter((event) => event.source !== 'custom').length
  const shareDetails = profile?.share_details ?? true
  const lastStep = step === 3

  const handleJoin = async (e) => {
    e.preventDefault()

    const value = code.trim()
    if (!value) {
      setGroupError('Wpisz kod zaproszenia od znajomego.')
      return
    }

    setBusy('join')
    setGroupError('')
    setGroupMessage('')

    try {
      await joinGroupByCode(value)
      setJoined(true)
      setCode('')
      setGroupMessage('Dołączono do grupy.')
      onGroupsChanged?.()
    } catch (err) {
      setGroupError(`Nie udało się dołączyć: ${err.message}`)
    } finally {
      setBusy('')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    const value = groupName.trim()
    if (!value) {
      setGroupError('Podaj nazwę grupy.')
      return
    }

    setBusy('create')
    setGroupError('')
    setGroupMessage('')

    try {
      const group = await createGroup(value, user.id)
      setCreatedCode(group.invite_code ?? '')
      setJoined(true)
      setGroupName('')
      setGroupMessage(`Utworzono grupę „${group.name}”. Przekaż znajomym kod zaproszenia.`)
      onGroupsChanged?.()
    } catch (err) {
      setGroupError(`Nie udało się utworzyć grupy: ${err.message}`)
    } finally {
      setBusy('')
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(createdCode)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const askPermission = async () => {
    setPermission(await requestNotificationPermission())
  }

  const togglePrivacy = async (next) => {
    setPrivacyBusy(true)
    setPrivacyError('')

    try {
      await updateProfile(user.id, { share_details: next })
      await refreshProfile()
    } catch (err) {
      setPrivacyError(`Nie udało się zapisać: ${err.message}`)
    } finally {
      setPrivacyBusy(false)
    }
  }

  const inputClass = `${selectClass} w-full`

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Kreator pierwszego uruchomienia"
    >
      <div className="modal-card flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-t-[6px] border-indigo-600 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Witaj w USOS FreeTime</h2>
            <p className="text-sm text-slate-500">
              Trzy krótkie kroki, a potem możesz zacząć.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            Pomiń kreator
          </button>
        </div>

        {/* Postęp */}
        <ol className="flex items-center gap-2 px-6 pb-2">
          {STEPS.map((item, index) => {
            const done = index < step
            const active = index === step
            const Icon = item.icon

            return (
              <li key={item.id} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                    done
                      ? 'bg-indigo-600 text-white'
                      : active
                        ? 'border-2 border-indigo-600 text-indigo-600'
                        : 'border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span
                  className={`hidden text-sm sm:inline ${
                    active ? 'font-semibold text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
                {index < STEPS.length - 1 && (
                  <span
                    className={`h-0.5 flex-1 rounded transition ${
                      done ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div key={step} className="page-enter flex flex-col gap-4">
            {step === 0 && (
              <>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    1. Zaimportuj swój plan
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Wgraj plik z planem (CSV z USOS lub UniTime albo kalendarz
                    .ics). Format rozpoznamy sam. Możesz też zrobić to później.
                  </p>
                </div>

                {planCount > 0 && (
                  <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    <Check className="h-4 w-4 shrink-0" />
                    Masz zapisane zajęcia: {planCount}.
                  </p>
                )}

                <ImportSchedule onImported={onImported} existing={events} />
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    2. Dołącz do znajomych
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Wspólne okienka działają, gdy jesteście w jednej grupie.
                    Dołącz kodem od znajomego albo załóż własną grupę.
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {[
                    { id: 'join', label: 'Mam kod zaproszenia' },
                    { id: 'create', label: 'Utwórz grupę' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setMode(option.id)
                        setGroupError('')
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        mode === option.id
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {mode === 'join' ? (
                  <form onSubmit={handleJoin} className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Kod zaproszenia"
                      className={`${inputClass} min-w-0 flex-1`}
                    />
                    <button type="submit" disabled={busy !== ''} className={primaryClass}>
                      {busy === 'join' && <Loader2 className="h-4 w-4 animate-spin" />}
                      Dołącz
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Nazwa grupy, np. Ekipa od obiadów"
                      maxLength={60}
                      className={`${inputClass} min-w-0 flex-1`}
                    />
                    <button type="submit" disabled={busy !== ''} className={primaryClass}>
                      {busy === 'create' && <Loader2 className="h-4 w-4 animate-spin" />}
                      Utwórz
                    </button>
                  </form>
                )}

                {groupError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {groupError}
                  </p>
                )}

                {groupMessage && (
                  <p className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    {groupMessage}
                  </p>
                )}

                {createdCode && (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-3">
                    <span className="text-sm text-slate-500">Kod zaproszenia:</span>
                    <code className="rounded bg-white px-2 py-1 text-base font-bold tracking-wider text-slate-800">
                      {createdCode}
                    </code>
                    <button type="button" onClick={copyCode} className={`${buttonClass} flex items-center gap-1.5`}>
                      <Copy className="h-4 w-4" />
                      {copied ? 'Skopiowano' : 'Kopiuj'}
                    </button>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    3. Powiadomienia i prywatność
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Wszystko zmienisz później w Ustawieniach.
                  </p>
                </div>

                <div className="flex flex-col divide-y divide-slate-100">
                  <Row
                    label="Przypomnienia o sprawdzianach"
                    hint="Dzień przed i w dniu kolokwium lub egzaminu, gdy aplikacja jest otwarta lub działa w tle."
                  >
                    <Switch
                      checked={settings.remindersEnabled}
                      onChange={(value) => updateSettings({ remindersEnabled: value })}
                      label="Przypomnienia o sprawdzianach"
                    />
                  </Row>

                  <Row label="Powiadomienia systemowe" hint={PERMISSION_TEXT[permission] ?? permission}>
                    {permission === 'default' && (
                      <button
                        type="button"
                        onClick={askPermission}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Włącz
                      </button>
                    )}
                  </Row>

                  <Row
                    label="Pokazuj znajomym szczegóły moich zajęć"
                    hint="Po wyłączeniu znajomi zobaczą tylko blok „Zajęty” z godzinami. Pojedyncze zajęcia możesz też ukryć później."
                  >
                    <Switch
                      checked={shareDetails}
                      onChange={togglePrivacy}
                      disabled={privacyBusy || !profile}
                      label="Pokazuj szczegóły znajomym"
                    />
                  </Row>
                </div>

                {privacyError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {privacyError}
                  </p>
                )}
              </>
            )}

            {lastStep && (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">Gotowe!</h3>
                    <p className="text-sm text-slate-500">Oto, co udało się ustawić.</p>
                  </div>
                </div>

                <ul className="flex flex-col gap-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {planCount > 0
                      ? `Plan: ${planCount} zajęć.`
                      : 'Plan zaimportujesz później w zakładce „Mój plan”.'}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {joined
                      ? 'Jesteś w grupie ze znajomymi.'
                      : 'Grupę dodasz później w zakładce „Grupy”.'}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {PERMISSION_TEXT[permission] ?? permission}
                  </li>
                </ul>

                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">Warto wiedzieć:</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li>Ołówek w nagłówku pozwala przestawiać bloki i dodawać szybkie linki.</li>
                    <li>Ctrl+K (na telefonie lupa) wyszukuje przedmioty, sale i prowadzących.</li>
                    <li>Kliknij swoje zajęcia, żeby ukryć je przed znajomymi.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
            className={`${buttonClass} ${step === 0 ? 'invisible' : ''}`}
          >
            Wstecz
          </button>

          {lastStep ? (
            <button type="button" onClick={onClose} className={primaryClass}>
              Zaczynamy
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((value) => Math.min(3, value + 1))}
              className={primaryClass}
            >
              {step === 2 ? 'Zakończ' : 'Dalej'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}