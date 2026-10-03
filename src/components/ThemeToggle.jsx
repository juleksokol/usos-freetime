import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'freetime:theme'

function readIsDark() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark') return true
    if (stored === 'light') return false
  } catch {
    // brak dostępu do pamięci przeglądarki
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(readIsDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // zmiana działa do odświeżenia strony
    }
  }

  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100"
      aria-label={isDark ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'}
      title={isDark ? 'Tryb jasny' : 'Tryb ciemny'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}