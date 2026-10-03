import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Wywołuje onChange, gdy zmienią się Twoje zajęcia lub skład grup (Supabase Realtime)
// oraz gdy wracasz do karty aplikacji (żeby odświeżyć plany znajomych).
export default function useRealtimeSync(userId, onChange) {
  const callbackRef = useRef(onChange)

  useEffect(() => {
    callbackRef.current = onChange
  })

  useEffect(() => {
    if (!userId) return

    let timer = null
    const notify = () => {
      clearTimeout(timer)
      timer = setTimeout(() => callbackRef.current?.(), 600)
    }

    const channel = supabase
      .channel(`sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_events',
          filter: `user_id=eq.${userId}`,
        },
        notify
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members' },
        notify
      )
      .subscribe()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') notify()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
      supabase.removeChannel(channel)
    }
  }, [userId])
}