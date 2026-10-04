import { createContext, useContext } from 'react'

export const SettingsContext = createContext(null)

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings musi być używany wewnątrz SettingsProvider')
  }
  return ctx
}