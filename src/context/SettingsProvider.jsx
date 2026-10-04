import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_SETTINGS } from '../lib/settingsDefaults'
import { useAuth } from './AuthContext'
import { SettingsContext } from './SettingsContext'

const STORAGE_KEY = 'freetime:settings'
const FONT_SIZES = { small: '14px', normal: '16px', large: '18px' }

// Zapisujemy tylko wartości zmienione względem domyślnych ("overrides"),
// dzięki temu nowe opcje i domyślne wartości aktualizują się razem z aplikacją.
function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : {}
    }
    const legacyTheme = localStorage.getItem('freetime:theme')
    if (legacyTheme === 'dark' || legacyTheme === 'light') {
      return { theme: legacyTheme }
    }
  } catch {
    // brak dostępu do pamięci przeglądarki
  }
  return {}
}

function writeLocal(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // brak dostępu do pamięci przeglądarki
  }
}

export default function SettingsProvider({ children }) {
  const { user, profile } = useAuth()
  const userId = user?.id

  const [overrides, setOverrides] = useState(readLocal)
  const overridesRef = useRef(overrides)
  const syncedUserRef = useRef(null)
  const saveTimerRef = useRef(null)

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...overrides }),
    [overrides]
  )

  // Po zalogowaniu pobieramy ustawienia zapisane na koncie (mają pierwszeństwo)
  useEffect(() => {
    if (!userId || !profile || syncedUserRef.current === userId) return
    syncedUserRef.current = userId

    const remote = profile.ui_settings
    if (remote && typeof remote === 'object' && !Array.isArray(remote)) {
      overridesRef.current = remote
      setOverrides(remote)
      writeLocal(remote)
    }
  }, [userId, profile])

  const persist = useCallback(
    (next) => {
      writeLocal(next)
      if (!userId) return

      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        supabase
          .from('profiles')
          .update({ ui_settings: next })
          .eq('id', userId)
          .then(
            () => {},
            () => {}
          )
      }, 800)
    },
    [userId]
  )

  const updateSettings = useCallback(
    (patch) => {
      const next = { ...overridesRef.current, ...patch }
      overridesRef.current = next
      setOverrides(next)
      persist(next)
    },
    [persist]
  )

  const resetSettings = useCallback(() => {
    overridesRef.current = {}
    setOverrides({})
    persist({})
  }, [persist])

  // Motyw systemowy
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const isDark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemDark)

  // Zastosowanie motywu, akcentu i rozmiaru tekstu na całej stronie
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)

    Array.from(root.classList)
      .filter((name) => name.startsWith('accent-'))
      .forEach((name) => root.classList.remove(name))
    root.classList.add(`accent-${settings.accent}`)

    root.style.fontSize = FONT_SIZES[settings.fontScale] ?? FONT_SIZES.normal
  }, [isDark, settings.accent, settings.fontScale])

  const value = { settings, updateSettings, resetSettings, isDark }

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}