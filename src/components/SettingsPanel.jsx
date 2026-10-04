import { useState } from 'react'
import {
  CalendarDays,
  Dumbbell,
  LayoutDashboard,
  Loader2,
  Palette,
  RotateCcw,
  ShieldCheck,
  Trash2,
  User,
  Utensils,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { deleteMyAccount, updateProfile } from '../lib/accountService'
import { PERSON_PALETTES } from '../lib/constants'
import { deleteAllMyEvents } from '../lib/scheduleService'
import {
  ACCENT_OPTIONS,
  DEFAULT_SETTINGS,
  PANEL_OPTIONS,
  TAB_OPTIONS,
} from '../lib/settingsDefaults'
import { Row, Section, Segmented, Switch, selectClass } from './SettingsControls'

const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)

const START_HOURS = range(5, 12)
const END_HOURS = range(14, 24)
const LUNCH_START_HOURS = range(9, 14)
const DURATION_OPTIONS = [30, 45, 60, 90]

export default function SettingsPanel({ onDataChanged }) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { settings, updateSettings, resetSettings } = useSettings()
  const userId = user?.id

  const [nickname, setNickname] = useState(null) // null = nie edytowano
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const shareDetails = profile?.share_details ?? true
  const nicknameValue = nickname ?? profile?.display_name ?? ''

  const run = async (name, action, successMessage) => {
    setBusy(name)
    setError('')
    setMessage('')
    try {
      await action()
      if (successMessage) setMessage(successMessage)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const set = (key) => (value) => updateSettings({ [key]: value })

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

  const commitNumber = (key, min, max) => (e) => {
    const parsed = Number.parseInt(e.target.value, 10)
    const value = Number.isNaN(parsed)
      ? DEFAULT_SETTINGS[key]
      : Math.min(max, Math.max(min, parsed))
    updateSettings({ [key]: value })
    e.target.value = String(value)
  }

  const saveNickname = (e) => {
    e.preventDefault()
    const value = nicknameValue.trim()
    if (value.length < 1 || value.length > 40) {
      setError('Pseudonim musi mieć od 1 do 40 znaków.')
      return
    }

    run(
      'nickname',
      async () => {
        await updateProfile(userId, { display_name: value })
        await refreshProfile()
        setNickname(null)
      },
      'Zapisano pseudonim.'
    )
  }

  const togglePrivacy = (next) => {
    run(
      'privacy',
      async () => {
        await updateProfile(userId, { share_details: next })
        await refreshProfile()
      },
      next
        ? 'Znajomi widzą teraz szczegóły Twoich zajęć.'
        : 'Znajomi widzą teraz tylko, że jesteś zajęty.'
    )
  }

  const deletePlan = () => {
    if (
      !window.confirm(
        'Usunąć cały Twój plan (zaimportowany i własne wydarzenia)? Tej operacji nie można cofnąć.'
      )
    ) {
      return
    }

    run(
      'plan',
      async () => {
        await deleteAllMyEvents(userId)
        await onDataChanged?.()
      },
      'Usunięto wszystkie Twoje zajęcia.'
    )
  }

  const deleteAccount = () => {
    run('account', async () => {
      await deleteMyAccount()
      await signOut()
    })
  }

  const handleReset = () => {
    if (!window.confirm('Przywrócić wszystkie ustawienia interfejsu do domyślnych?')) {
      return
    }
    resetSettings()
    setMessage('Przywrócono ustawienia domyślne.')
  }

  const numberInputClass = `${selectClass} w-24`

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      <Section
        icon={Palette}
        title="Wygląd"
        description="Ustawienia zapisują się na Twoim koncie, więc obowiązują na każdym urządzeniu."
      >
        <Row label="Motyw">
          <Segmented
            value={settings.theme}
            onChange={set('theme')}
            options={[
              { value: 'system', label: 'Systemowy' },
              { value: 'light', label: 'Jasny' },
              { value: 'dark', label: 'Ciemny' },
            ]}
          />
        </Row>

        <Row label="Kolor akcentu">
          <div className="flex gap-2">
            {ACCENT_OPTIONS.map((accent) => (
              <button
                key={accent.id}
                type="button"
                onClick={() => updateSettings({ accent: accent.id })}
                aria-label={accent.label}
                title={accent.label}
                className={`h-8 w-8 rounded-full transition ${
                  settings.accent === accent.id
                    ? 'ring-2 ring-slate-800 ring-offset-2'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: accent.color }}
              />
            ))}
          </div>
        </Row>

        <Row label="Rozmiar tekstu">
          <Segmented
            value={settings.fontScale}
            onChange={set('fontScale')}
            options={[
              { value: 'small', label: 'Mały' },
              { value: 'normal', label: 'Normalny' },
              { value: 'large', label: 'Duży' },
            ]}
          />
        </Row>

        <Row
          label="Paleta kolorów osób"
          hint="Kolory, którymi oznaczone są osoby na wspólnym planie."
        >
          <div className="flex flex-col items-end gap-2">
            <Segmented
              value={settings.personPalette}
              onChange={set('personPalette')}
              options={[
                { value: 'standard', label: 'Standardowa' },
                { value: 'colorblind', label: 'Dla daltonistów' },
                { value: 'pastel', label: 'Pastelowa' },
              ]}
            />
            <div className="flex gap-1">
              {(PERSON_PALETTES[settings.personPalette] ?? PERSON_PALETTES.standard).map(
                (color) => (
                  <span
                    key={color}
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )
              )}
            </div>
          </div>
        </Row>
      </Section>

      <Section
        icon={CalendarDays}
        title="Siatka planu"
        description="Jak wygląda tygodniowa siatka zajęć."
      >
        <Row label="Gęstość siatki" hint="Wysokość jednej godziny.">
          <Segmented
            value={settings.density}
            onChange={set('density')}
            options={[
              { value: 'compact', label: 'Kompaktowa' },
              { value: 'normal', label: 'Normalna' },
              { value: 'spacious', label: 'Przestronna' },
            ]}
          />
        </Row>

        <Row label="Pierwsza godzina siatki">
          <select
            value={settings.gridStartHour}
            onChange={(e) => updateSettings({ gridStartHour: Number(e.target.value) })}
            className={selectClass}
          >
            {START_HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}:00
              </option>
            ))}
          </select>
        </Row>

        <Row label="Ostatnia godzina siatki">
          <select
            value={settings.gridEndHour}
            onChange={(e) => updateSettings({ gridEndHour: Number(e.target.value) })}
            className={selectClass}
          >
            {END_HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}:00
              </option>
            ))}
          </select>
        </Row>

        <Row label="Sobota i niedziela" hint="Dodatkowe kolumny na siatce i w okienkach.">
          <Switch
            checked={settings.showWeekend}
            onChange={set('showWeekend')}
            label="Pokaż weekend"
          />
        </Row>

        <Row label="Pseudonim jako znak wodny na zajęciach">
          <Switch
            checked={settings.showWatermark}
            onChange={set('showWatermark')}
            label="Znak wodny"
          />
        </Row>

        <Row label="Legenda z osobami nad siatką">
          <Switch
            checked={settings.showLegend}
            onChange={set('showLegend')}
            label="Legenda"
          />
        </Row>

        <Row label="Godziny na kafelkach">
          <Switch
            checked={settings.tileShowTime}
            onChange={set('tileShowTime')}
            label="Godziny na kafelkach"
          />
        </Row>

        <Row label="Miejsce (sala) na kafelkach">
          <Switch
            checked={settings.tileShowLocation}
            onChange={set('tileShowLocation')}
            label="Miejsce na kafelkach"
          />
        </Row>

        <Row
          label="Wyróżniaj własne wydarzenia"
          hint="Przerywana ramka i ukośny wzór na kafelkach."
        >
          <Switch
            checked={settings.highlightCustom}
            onChange={set('highlightCustom')}
            label="Wyróżnianie własnych wydarzeń"
          />
        </Row>
      </Section>

      <Section
        icon={LayoutDashboard}
        title="Układ aplikacji"
        description="Wybierz, co ma być widoczne. Ustawienia zawsze pozostają dostępne."
      >
        <Row label="Zakładka startowa">
          <select
            value={settings.startTab}
            onChange={(e) => updateSettings({ startTab: e.target.value })}
            className={selectClass}
          >
            <option value="last">Ostatnio używana</option>
            {TAB_OPTIONS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </Row>

        {TAB_OPTIONS.map((tab) => (
          <Row key={tab.id} label={`Zakładka „${tab.label}”`}>
            <Switch
              checked={!settings.hiddenTabs.includes(tab.id)}
              onChange={(visible) => setVisible('hiddenTabs', tab.id, visible)}
              label={`Pokaż zakładkę ${tab.label}`}
            />
          </Row>
        ))}

        {PANEL_OPTIONS.map((panel) => (
          <Row key={panel.id} label={panel.label} hint={panel.hint}>
            <Switch
              checked={!settings.hiddenPanels.includes(panel.id)}
              onChange={(visible) => setVisible('hiddenPanels', panel.id, visible)}
              label={`Pokaż panel ${panel.label}`}
            />
          </Row>
        ))}
      </Section>

      <Section
        icon={Utensils}
        title="Wspólne okienka"
        description="Domyślne ustawienia wyszukiwania okienek."
      >
        <Row label="Minimalna długość okienka">
          <select
            value={settings.minDuration}
            onChange={(e) => updateSettings({ minDuration: Number(e.target.value) })}
            className={selectClass}
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </Row>

        <Row label="Tylko pora obiadu" hint="Szukaj okienek tylko w oknie czasu poniżej.">
          <Switch
            checked={settings.lunchOnly}
            onChange={set('lunchOnly')}
            label="Tylko pora obiadu"
          />
        </Row>

        <Row label="Pora obiadu: od">
          <select
            value={settings.lunchStart}
            onChange={(e) => {
              const start = Number(e.target.value)
              updateSettings({
                lunchStart: start,
                lunchEnd: Math.max(settings.lunchEnd, start + 1),
              })
            }}
            className={selectClass}
          >
            {LUNCH_START_HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}:00
              </option>
            ))}
          </select>
        </Row>

        <Row label="Pora obiadu: do">
          <select
            value={settings.lunchEnd}
            onChange={(e) => updateSettings({ lunchEnd: Number(e.target.value) })}
            className={selectClass}
          >
            {range(10, 18)
              .filter((hour) => hour > settings.lunchStart)
              .map((hour) => (
                <option key={hour} value={hour}>
                  {hour}:00
                </option>
              ))}
          </select>
        </Row>
      </Section>

      <Section
        icon={Dumbbell}
        title="Licznik pompek"
        description="Dzienna liczba rośnie o stały przyrost co 7 dni od daty startu."
      >
        <Row label="Data startu wyzwania">
          <input
            type="date"
            value={settings.pushupsStartDate}
            onChange={(e) => {
              if (e.target.value) updateSettings({ pushupsStartDate: e.target.value })
            }}
            className={selectClass}
          />
        </Row>

        <Row label="Pompek dziennie na starcie">
          <input
            key={`start-${settings.pushupsStartCount}`}
            type="number"
            min={0}
            max={999}
            defaultValue={settings.pushupsStartCount}
            onBlur={commitNumber('pushupsStartCount', 0, 999)}
            className={numberInputClass}
          />
        </Row>

        <Row label="Przyrost co tydzień">
          <input
            key={`inc-${settings.pushupsWeeklyIncrement}`}
            type="number"
            min={0}
            max={100}
            defaultValue={settings.pushupsWeeklyIncrement}
            onBlur={commitNumber('pushupsWeeklyIncrement', 0, 100)}
            className={numberInputClass}
          />
        </Row>
      </Section>

      <Section icon={RotateCcw} title="Przywracanie">
        <Row
          label="Przywróć domyślne ustawienia interfejsu"
          hint="Nie usuwa Twojego planu ani grup."
        >
          <button
            onClick={handleReset}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Przywróć
          </button>
        </Row>
      </Section>

      <Section icon={User} title="Profil">
        <div className="py-3">
          <p className="text-sm text-slate-500">
            Pseudonim widzą znajomi z grup (także jako znak wodny na zajęciach).
          </p>
          <form onSubmit={saveNickname} className="mt-3 flex gap-2">
            <input
              type="text"
              value={nicknameValue}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              className={`${selectClass} min-w-0 flex-1`}
            />
            <button
              type="submit"
              disabled={busy === 'nickname' || nickname === null}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Zapisz
            </button>
          </form>
        </div>
      </Section>

      <Section icon={ShieldCheck} title="Prywatność">
        <Row
          label="Pokazuj znajomym szczegóły moich zajęć"
          hint="Po wyłączeniu znajomi z Twoich grup zobaczą tylko blok „Zajęty” z godzinami, bez nazwy przedmiotu, sali i prowadzącego."
        >
          <Switch
            checked={shareDetails}
            onChange={togglePrivacy}
            disabled={busy === 'privacy' || !profile}
            label="Pokazuj szczegóły znajomym"
          />
        </Row>
      </Section>

      <Section icon={Trash2} title="Dane i konto">
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
            Usunięcie konta kasuje Twój profil, plan i członkostwa. Grupy,
            których jesteś właścicielem, zostaną usunięte dla wszystkich ich
            członków. Tej operacji nie można cofnąć.
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
              disabled={
                busy === 'account' ||
                confirmText.trim().toUpperCase() !== 'USUŃ'
              }
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'account' && <Loader2 className="h-4 w-4 animate-spin" />}
              Usuń konto
            </button>
          </div>
        </div>
      </Section>
    </div>
  )
}