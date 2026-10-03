import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { clearAllCaches } from '../lib/offlineCache'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sesja: pobierz przy starcie i nasłuchuj zmian (logowanie / wylogowanie)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id ?? null

  // Profil: pobierz po zalogowaniu (utworzony przez trigger w bazie)
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }

    let cancelled = false

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled && !error) setProfile(data)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  // Ponowne pobranie profilu (po zmianie pseudonimu lub ustawień prywatności)
  const refreshProfile = useCallback(async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!error) setProfile(data)
  }, [userId])

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password, displayName) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

  const signOut = async () => {
    clearAllCaches()
    return supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}