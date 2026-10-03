import { useEffect, useState } from 'react'
import { fetchMyGroups } from '../lib/groupService'

// Grupy zalogowanego użytkownika; zmiana syncTick pobiera je ponownie
export default function useGroups(syncTick = 0) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    fetchMyGroups()
      .then((data) => {
        if (cancelled) return
        setGroups(data)
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(`Nie udało się pobrać grup: ${err.message}`)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [syncTick])

  return { groups, loading, error }
}