import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useTests } from '../context/TestsContext'
import { eventsForWeek, eventsOnDate } from '../lib/dateUtils'
import { testToEvent } from '../lib/tests'

/**
 * Twoje sprawdziany jako zajęty czas we wspólnych okienkach.
 * Sprawdziany widzisz tylko Ty, więc dotyczą wyłącznie Ciebie (userId).
 *
 * onDate(data) i forWeek(poniedziałek) zwracają zajęte przedziały albo pustą listę,
 * gdy opcja „Moje sprawdziany jako zajęty czas” jest wyłączona.
 */
export default function useTestBusy() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { tests } = useTests()

  return useMemo(() => {
    const events = settings.testsCountAsBusy === false ? [] : tests.map(testToEvent)

    return {
      userId: user?.id,
      onDate: (date) => eventsOnDate(events, date),
      forWeek: (weekStart) => eventsForWeek(events, weekStart),
    }
  }, [tests, settings.testsCountAsBusy, user?.id])
}