import { Moon, Sun } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

export default function ThemeToggle() {
  const { isDark, updateSettings } = useSettings()

  return (
    <button
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
      className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100"
      aria-label={isDark ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'}
      title={isDark ? 'Tryb jasny' : 'Tryb ciemny'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}