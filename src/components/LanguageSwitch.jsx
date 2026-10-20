import { useI18n } from '../context/I18nContext'

// Nazwy języków zapisujemy w ich własnych językach, więc nie wymagają tłumaczenia
const OPTIONS = [
  { value: 'pl', label: 'PL', name: 'Polski' },
  { value: 'en', label: 'EN', name: 'English' },
]

// Przełącznik języka PL / EN (działa też na ekranie logowania)
export default function LanguageSwitch({ className = '' }) {
  const { lang, setLang } = useI18n()

  return (
    <div
      role="group"
      aria-label="Język / Language"
      className={`inline-flex rounded-lg border border-slate-300 p-0.5 ${className}`}
    >
      {OPTIONS.map((option) => {
        const active = lang === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLang(option.value)}
            aria-pressed={active}
            aria-label={option.name}
            title={option.name}
            lang={option.value}
            className={`h-8 min-w-9 rounded-md px-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 ${
              active ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}