import { useState } from 'react'
import { useActions } from '../../context/ActionsContext'
import { useI18n } from '../../context/I18nContext'
import { VISIBILITY_LABEL_KEYS } from '../../lib/labelKeys'
import { Row, selectClass } from './controls'

// Lista przedmiotów z własną widocznością dla znajomych (reguły ustawiane z okna zajęć)
export function VisibilityRules() {
  const { rules, setSubjectVisibility } = useActions()
  const { t } = useI18n()
  const [error, setError] = useState('')

  const entries = Object.entries(rules ?? {}).sort(([a], [b]) =>
    a.localeCompare(b, 'pl')
  )

  const change = async (subject, value) => {
    setError('')
    try {
      await setSubjectVisibility?.(subject, value)
    } catch (err) {
      setError(t('settings.rules.error', { message: err.message }))
    }
  }

  return (
    <div className="py-3">
      <p className="text-sm font-medium text-slate-800">{t('settings.rules.title')}</p>
      <p className="mt-0.5 text-sm text-slate-500">{t('settings.rules.hint')}</p>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{t('settings.rules.none')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {entries.map(([subject, visibility]) => (
            <li key={subject} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1 basis-40 break-words text-sm text-slate-800">
                {subject}
              </span>
              <select
                value={visibility}
                onChange={(e) => change(subject, e.target.value)}
                className={selectClass}
                aria-label={t('settings.rules.aria', { subject })}
              >
                {['busy', 'hidden'].map((value) => (
                  <option key={value} value={value}>
                    {t(VISIBILITY_LABEL_KEYS[value])}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => change(subject, 'default')}
                className="text-sm text-slate-500 transition hover:text-slate-800"
              >
                {t('settings.rules.remove')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

// Ponowne uruchomienie kreatora pierwszego uruchomienia
export function WizardRow() {
  const { openWizard } = useActions()
  const { t } = useI18n()

  return (
    <Row label={t('settings.wizard.label')} hint={t('settings.wizard.hint')}>
      <button
        type="button"
        onClick={() => openWizard?.()}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        {t('settings.wizard.run')}
      </button>
    </Row>
  )
}
