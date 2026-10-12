import { createClient } from '@supabase/supabase-js'
import { activeStorage } from './session'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Brak zmiennych VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY w pliku .env.local'
  )
}

// Magazyn sesji zależny od wyboru "Zapamiętaj mnie"
const authStorage = {
  getItem: (key) => activeStorage().getItem(key),
  setItem: (key, value) => activeStorage().setItem(key, value),
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    } catch {
      // pomijamy
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})