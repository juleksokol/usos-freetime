import { useEffect, useState } from 'react'

// Jak useState, ale wartość jest zapamiętywana w przeglądarce
export default function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initialValue : JSON.parse(raw)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // brak dostępu do pamięci przeglądarki: wartość działa do odświeżenia
    }
  }, [key, value])

  return [value, setValue]
}