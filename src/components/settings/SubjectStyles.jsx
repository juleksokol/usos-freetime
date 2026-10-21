import { useMemo } from 'react'
import { useI18n } from '../../context/I18nContext'
import { useSettings } from '../../context/SettingsContext'
import { getPalette } from '../../lib/constants'
import { suggestAbbreviation } from '../../lib/subjects'
import { selectClass } from './controls'

/**
 * subjects: lista nazw przedmiotów z Twojego planu
 */
export default function SubjectStyles({ subjects }) {
  const { settings, updateSettings } = useSettings()
  const { t } = useI18n()

  const defaultColor = getPalette(settings.personPalette)[0]
  const styles = useMemo(() => settings.subjectStyles ?? {}, [settings.subjectStyles])

  // Zapisuje styl przedmiotu; pusty styl (bez koloru i skrótu) jest usuwany
  const setStyle = (subject, patch) => {
    const merged = { ...(styles[subject] ?? {}), ...patch }
    if (!merged.color) delete merged.color
    if (!merged.abbr) delete merged.abbr

    const next = { ...styles }
    if (Object.keys(merged).length === 0) {
      delete next[subject]
    } else {
      next[subject] = merged
    }
    updateSettings({ subjectStyles: next })
  }

  // Proponuje skróty dla przedmiotów, które jeszcze ich nie mają (bez powtórzeń)
  const suggestAll = () => {
    const taken = new Set(
      Object.values(styles)
        .map((style) => style.abbr)
        .filter(Boolean)
    )
    const next = { ...styles }

    for (const subject of subjects) {
      if (next[subject]?.abbr) continue
      const abbr = suggestAbbreviation(subject, taken)
      taken.add(abbr)
      next[subject] = { ...(next[subject] ?? {}), abbr }
    }

    updateSettings({ subjectStyles: next })
  }

  const clearAll = () => {
    if (!window.confirm(t('settings.subjects.clearConfirm'))) return
    updateSettings({ subjectStyles: {} })
  }

  const buttonClass =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100'

  if (subjects.length === 0) {
    return <p className="py-3 text-sm text-slate-500">{t('settings.subjects.empty')}</p>
  }

  return (
    <>
      <div className="py-3">
        <p className="text-sm text-slate-500">{t('settings.subjects.intro')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={suggestAll} className={buttonClass}>
            {t('settings.subjects.suggest')}
          </button>
          <button onClick={clearAll} className={buttonClass}>
            {t('settings.subjects.clear')}
          </button>
        </div>
      </div>

      {subjects.map((subject) => {
        const style = styles[subject] ?? {}

        return (
          <div key={subject} className="flex flex-wrap items-center gap-3 py-3">
            <input
              type="color"
              value={style.color ?? defaultColor}
              onChange={(e) => setStyle(subject, { color: e.target.value })}
              className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-0.5"
              aria-label={t('settings.subjects.colorAria', { subject })}
              title={t('settings.subjects.colorTitle')}
            />
            <span className="min-w-0 flex-1 basis-40 text-sm text-slate-800">
              {subject}
            </span>
            <input
              type="text"
              value={style.abbr ?? ''}
              onChange={(e) => setStyle(subject, { abbr: e.target.value.slice(0, 6) })}
              placeholder={t('settings.subjects.abbr')}
              maxLength={6}
              className={`${selectClass} w-24`}
              aria-label={t('settings.subjects.abbrAria', { subject })}
            />
            <button
              onClick={() => setStyle(subject, { color: null, abbr: null })}
              disabled={!style.color && !style.abbr}
              className="text-sm text-slate-500 transition hover:text-slate-800 disabled:opacity-40"
            >
              {t('settings.subjects.reset')}
            </button>
          </div>
        )
      })}
    </>
  )
}
