import { useEffect } from 'react'
import { showLocalNotification, notificationPermission } from '../lib/notifications'
import { getDueReminders, testDisplayName } from '../lib/tests'

const STORAGE_KEY = 'freetime:notified'

function loadNotified() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveNotified(map) {
  // trzymamy tylko ostatnie wpisy, żeby pamięć nie rosła w nieskończoność
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 200)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    // brak dostępu do pamięci przeglądarki
  }
}

function buildNotification({ test, when }) {
  const name = testDisplayName(test)
  const place = test.location ? ` · ${test.location}` : ''
  const notes = test.notes ? `\n${test.notes.slice(0, 120)}` : ''

  return {
    title: `${when === 'tomorrow' ? 'Jutro' : 'Dziś'}: ${name}`,
    options: {
      body: `${test.subject} · ${test.start_time.slice(0, 5)}–${test.end_time.slice(0, 5)}${place}${notes}`,
      tag: `${test.id}:${when}`,
    },
  }
}

/**
 * Przypomnienia o sprawdzianach (dzień przed od godziny `hour` oraz w dniu sprawdzianu).
 * Działają, gdy aplikacja jest uruchomiona (także w tle). Każde przypomnienie pokazuje się raz.
 */
export default function useTestReminders(tests, { enabled, hour }) {
  useEffect(() => {
    if (!enabled) return

    const check = async () => {
      if (notificationPermission() !== 'granted') return

      const notified = loadNotified()
      const due = getDueReminders(tests, new Date(), hour).filter(
        (item) => !notified[item.key]
      )

      for (const item of due) {
        const { title, options } = buildNotification(item)
        const shown = await showLocalNotification(title, options)
        if (shown) notified[item.key] = Date.now()
      }

      if (due.length > 0) saveNotified(notified)
    }

    check()
    const timer = setInterval(check, 60000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [tests, enabled, hour])
}