import { useMemo } from 'react'
import { useI18n } from '../context/I18nContext'
import {
  dayName,
  formatDate,
  formatDayMonth,
  formatLongDate,
  formatWeekRange,
  shortMonth,
} from '../lib/localeFormat'

// Formatowanie dat i nazw dni według języka interfejsu
export default function useFormat() {
  const { locale } = useI18n()

  return useMemo(
    () => ({
      date: (iso) => formatDate(iso, locale),
      dayMonth: (iso) => formatDayMonth(iso, locale),
      longDate: (iso) => formatLongDate(iso, locale),
      weekRange: (mondayISO) => formatWeekRange(mondayISO, locale),
      dayName: (day, style) => dayName(day, locale, style),
      shortMonth: (iso) => shortMonth(iso, locale),
    }),
    [locale]
  )
}
