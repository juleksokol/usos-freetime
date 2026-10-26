import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import useFormat from '../hooks/useFormat'
import { addDays, defaultWeekStart } from '../lib/dateUtils'

const buttonClass =
  'flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100'

export default function WeekNav({ weekStart, onChange }) {
  const { t } = useI18n()
  const fmt = useFormat()

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <button
        onClick={() => onChange(addDays(weekStart, -7))}
        className={buttonClass}
        aria-label={t('week.prev')}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-0 text-center text-sm font-medium text-slate-700">
        {fmt.weekRange(weekStart)}
      </span>
      <button
        onClick={() => onChange(addDays(weekStart, 7))}
        className={buttonClass}
        aria-label={t('week.next')}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
      <button onClick={() => onChange(defaultWeekStart())} className={buttonClass}>
        {t('week.today')}
      </button>
    </div>
  )
}
