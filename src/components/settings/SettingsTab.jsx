import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useI18n } from '../../context/I18nContext'
import { useSettings } from '../../context/SettingsContext'
import usePersistentState from '../../hooks/usePersistentState'
import { filterGroups } from '../../lib/settingsSearch'
import A11yExtras from './A11yExtras'
import {
  DangerBody,
  ExportBody,
  PrivacyBody,
  ProfileBody,
  ResetBody,
} from './AccountBodies'
import { LayoutExtras, NotificationsExtras } from './ExtraBodies'
import LanguageBody from './LanguageBody'
import PasswordBody from './PasswordBody'
import { Section } from './controls'
import { SETTINGS_GROUPS } from './schema'
import SettingRows from './SettingRows'
import SubjectStyles from './SubjectStyles'
import { VisibilityRules, WizardRow } from './VisibilityBodies'

const ALL_SECTION_IDS = SETTINGS_GROUPS.flatMap((group) =>
  group.sections.map((section) => section.id)
)

// Zawartość jednej sekcji: wiersze ze schematu, dodatki albo własny komponent
function SectionBody({ section, subjects, onDataChanged }) {
  switch (section.custom) {
    case 'subjects':
      return <SubjectStyles subjects={subjects} />
    case 'profile':
      return <ProfileBody />
    case 'password':
      return <PasswordBody />
    case 'language':
      return <LanguageBody />
    case 'privacy':
      return (
        <>
          <PrivacyBody />
          <VisibilityRules />
        </>
      )
    case 'export':
      return <ExportBody />
    case 'reset':
      return (
        <>
          <WizardRow />
          <ResetBody />
        </>
      )
    case 'danger':
      return <DangerBody onDataChanged={onDataChanged} />
    default:
      break
  }

  return (
    <>
      {section.rows && <SettingRows rows={section.rows} />}
      {section.extra === 'layout' && <LayoutExtras />}
      {section.extra === 'notifications' && <NotificationsExtras />}
      {section.extra === 'a11y' && <A11yExtras />}
    </>
  )
}

/**
 * Zakładka "Ustawienia": grupy tematyczne, zwijane sekcje i wyszukiwarka.
 * subjects: nazwy przedmiotów z planu (kolory i skróty)
 * onDataChanged: odświeżenie danych po usunięciu planu
 */
export default function SettingsTab({ subjects, onDataChanged }) {
  const { settings } = useSettings()
  const { t } = useI18n()
  const [openMap, setOpenMap] = usePersistentState('freetime:settingsOpen', {
    appearance: true,
  })
  const [query, setQuery] = useState('')

  const searching = query.trim().length > 0
  const groups = useMemo(() => filterGroups(SETTINGS_GROUPS, query, t), [query, t])

  // Tekst sekcji: z klucza tłumaczenia albo zwykły napis (sekcja językowa jest dwujęzyczna)
  const label = (item, name) => (item[`${name}Key`] ? t(item[`${name}Key`]) : item[name])

  const toggle = (id) => setOpenMap({ ...openMap, [id]: !openMap[id] })

  const expandAll = () =>
    setOpenMap(Object.fromEntries(ALL_SECTION_IDS.map((id) => [id, true])))

  const collapseAll = () => setOpenMap({})

  // Przejście do grupy: otwiera jej pierwszą sekcję i przewija do nagłówka
  const jumpToGroup = (group) => {
    setQuery('')
    setOpenMap({ ...openMap, [group.sections[0].id]: true })
    requestAnimationFrame(() => {
      document
        .getElementById(`settings-group-${group.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <>
      <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
        <h2 className="text-lg font-semibold text-slate-800">{t('settings.tab.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('settings.tab.subtitle')}</p>

        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('settings.tab.search')}
            aria-label={t('settings.tab.search')}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={t('settings.tab.clear')}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SETTINGS_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => jumpToGroup(group)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              {t(group.titleKey)}
            </button>
          ))}

          <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" />

          <button
            type="button"
            onClick={expandAll}
            className="text-xs text-slate-500 transition hover:text-slate-800"
          >
            {t('settings.tab.expand')}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs text-slate-500 transition hover:text-slate-800"
          >
            {t('settings.tab.collapse')}
          </button>
        </div>
      </section>

      {groups.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
          {t('settings.tab.none', { query })}
        </p>
      )}

      {groups.map((group) => (
        <div key={group.id}>
          <h2
            id={`settings-group-${group.id}`}
            className="mb-3 flex scroll-mt-28 items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            {t(group.titleKey)}
            <span className="h-px flex-1 bg-slate-200" />
          </h2>

          <div className="flex flex-col gap-3">
            {group.sections.map((section) => (
              <Section
                key={section.id}
                title={label(section, 'title')}
                description={label(section, 'description')}
                icon={section.icon}
                summary={section.summary?.(settings, t)}
                open={searching || Boolean(openMap[section.id])}
                onToggle={() => toggle(section.id)}
              >
                <SectionBody
                  section={section}
                  subjects={subjects}
                  onDataChanged={onDataChanged}
                />
              </Section>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
