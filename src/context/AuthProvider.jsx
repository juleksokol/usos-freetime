import { useCallback, useEffect, useState } from 'react'
import { openedFromRecoveryLink, supabase } from '../lib/supabase'
import { clearAllCaches } from '../lib/offlineCache'
import { isPasswordValid, needsPasswordChange } from '../lib/passwordPolicy'
import { clearOtherStorageTokens, setRememberPreference } from '../lib/session'
import { AuthContext } from './AuthContext'

const RECOVERY_KEY = 'freetime:recovering'

// Reset hasła w toku: zapamiętujemy w karcie, żeby odświeżenie strony nie wpuściło do aplikacji
function readRecoveryFlag() {
  try {
    return window.sessionStorage.getItem(RECOVERY_KEY) === '1'
  } catch {
    return false
  }
}

function writeRecoveryFlag(on) {
  try {
    if (on) window.sessionStorage.setItem(RECOVERY_KEY, '1')
    else window.sessionStorage.removeItem(RECOVERY_KEY)
  } catch {
    // brak dostępu do pamięci przeglądarki
  }
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecoveringState] = useState(() => {
    // Otwarcie z linku resetu hasła (stary szablon e-maila) też prowadzi do ustawienia nowego hasła
    if (openedFromRecoveryLink) {
      writeRecoveryFlag(true)
      return true
    }
    return readRecoveryFlag()
  })
  const [weakLogin, setWeakLogin] = useState(false) // zalogowano hasłem niespełniającym wymagań

  const setRecovering = (on) => {
    writeRecoveryFlag(on)
    setRecoveringState(on)
  }

  // Sesja: pobierz przy starcie i nasłuchuj zmian (logowanie / wylogowanie)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)

      // Nieaktualna flaga resetu hasła (np. wygasła sesja)
      if (!data.session) {
        writeRecoveryFlag(false)
        setRecoveringState(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)

      // Link lub kod resetu hasła: do ustawienia nowego hasła nie wpuszczamy do aplikacji
      if (event === 'PASSWORD_RECOVERY') {
        writeRecoveryFlag(true)
        setRecoveringState(true)
      }
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

  // remember = true: logowanie zostaje po zamknięciu przeglądarki
  const signIn = async (email, password, remember = true) => {
    setRememberPreference(remember)
    clearOtherStorageTokens()

    // Hasło sprawdzamy, zanim pojawi się sesja, żeby słabe hasło od razu otworzyło ekran
    // zmiany hasła (bez mignięcia aplikacji)
    const weak = !isPasswordValid(password, { email })
    setWeakLogin(weak)

    const result = await supabase.auth.signInWithPassword({ email, password })

    if (result.error) {
      setWeakLogin(false)
      return result
    }

    if (weak) {
      // Zapis na koncie, żeby wymóg przetrwał odświeżenie strony
      await supabase.auth.updateUser({ data: { password_change_required: true } })
    }

    return result
  }

  const signUp = (email, password, displayName, remember = true) => {
    setRememberPreference(remember)
    clearOtherStorageTokens()
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
  }

  const signOut = async () => {
    clearAllCaches()
    setWeakLogin(false)
    return supabase.auth.signOut()
  }

  // Zmiana hasła zalogowanego użytkownika: najpierw sprawdzamy aktualne hasło (logowanie
  // odświeża też „niedawne logowanie” wymagane przez opcję Secure password change)
  const changePassword = async (currentPassword, newPassword) => {
    const email = session?.user?.email
    if (!email) return { error: { message: 'Auth session missing!' } }

    const check = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })
    if (check.error) return { error: check.error }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
      data: { password_change_required: false },
    })
    if (error) return { error }

    setWeakLogin(false)
    return { error: null }
  }

  // Reset hasła kodem z e-maila: 1) prośba o kod, 2) sprawdzenie kodu, 3) nowe hasło
  const requestPasswordReset = (email) => supabase.auth.resetPasswordForEmail(email.trim())

  const verifyResetCode = async (email, code) => {
    setRecovering(true) // zanim pojawi się sesja z kodu, nie wpuszczamy do aplikacji

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    })

    if (error) {
      setRecovering(false)
      return { error }
    }

    return { error: null }
  }

  const completePasswordReset = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { password_change_required: false },
    })
    if (error) return { error }

    setWeakLogin(false)
    setRecovering(false)
    return { error: null }
  }

  const cancelPasswordReset = async () => {
    setRecovering(false)
    clearAllCaches()
    await supabase.auth.signOut()
  }

  const user = session?.user ?? null

  const value = {
    session,
    user,
    profile,
    loading,
    recovering,
    mustChangePassword: !recovering && needsPasswordChange({ user, weakLogin }),
    refreshProfile,
    signIn,
    signUp,
    signOut,
    changePassword,
    requestPasswordReset,
    verifyResetCode,
    completePasswordReset,
    cancelPasswordReset,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}