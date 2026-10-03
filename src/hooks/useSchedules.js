import { useEffect, useState } from 'react'
import { fetchMemberSchedule } from '../lib/scheduleService'

const EMPTY = {}

// Plany wskazanych osób (userId -> zajęcia). Pobierane osobno dla każdej osoby
// (limit 1000 wierszy dotyczy jednego zapytania) i trzymane w pamięci do odświeżenia.
export default function useSchedules(userIds, syncTick = 0) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState('')

  const version = `${syncTick}:${refreshKey}`
  const [cache, setCache] = useState({ version, data: EMPTY })

  const data = cache.version === version ? cache.data : EMPTY
  const idsKey = userIds.join(',')

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : []
    const missing = ids.filter((id) => !(id in data))
    if (missing.length === 0) return

    let cancelled = false

    Promise.all(missing.map(async (id) => [id, await fetchMemberSchedule(id)]))
      .then((entries) => {
        if (cancelled) return
        setCache((previous) => ({
          version,
          data: {
            ...(previous.version === version ? previous.data : {}),
            ...Object.fromEntries(entries),
          },
        }))
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(`Nie udało się pobrać planów: ${err.message}`)
      })

    return () => {
      cancelled = true
    }
  }, [idsKey, version, data])

  const loading =
    !error && (idsKey ? idsKey.split(',') : []).some((id) => !(id in data))

  const refresh = () => {
    setError('')
    setRefreshKey((key) => key + 1)
  }

  return { schedules: data, loading, error, refresh }
}