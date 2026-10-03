import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, defaultWeekStart, formatWeekRange } from '../lib/dateUtils'

const buttonClass =
  'flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100'

export default function WeekNav({ weekStart, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(addDays(weekStart, -7))}
        className={buttonClass}
        aria-label="Poprzedni tydzień"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[11rem] text-center text-sm font-medium text-slate-700">
        {formatWeekRange(weekStart)}
      </span>
      <button
        onClick={() => onChange(addDays(weekStart, 7))}
        className={buttonClass}
        aria-label="Następny tydzień"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button onClick={() => onChange(defaultWeekStart())} className={buttonClass}>
        Dziś
      </button>
    </div>
  )
}