import { useI18n } from '../../context/I18nContext'

function Kbd({ children }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-700">
      {children}
    </kbd>
  )
}

// Tekst z oznaczeniami klawiszy: [[Tab]] jest pokazywane jako klawisz
function RichKeys({ text }) {
  return text
    .split(/\[\[(.+?)\]\]/)
    .map((part, index) => (index % 2 === 1 ? <Kbd key={index}>{part}</Kbd> : part))
}

const ITEM_KEYS = [
  'settings.a11y.tab',
  'settings.a11y.enter',
  'settings.a11y.search',
  'settings.a11y.esc',
  'settings.a11y.drag',
]

// Dodatek do sekcji „Dostępność”: obsługa bez myszy i link do deklaracji dostępności
export default function A11yExtras() {
  const { t } = useI18n()

  return (
    <div className="py-4">
      <p className="text-sm font-medium text-slate-800">{t('settings.a11y.heading')}</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
        {ITEM_KEYS.map((key) => (
          <li key={key}>
            <RichKeys text={t(key)} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-slate-600">{t('settings.a11y.motion')}</p>
      <a
        href="#/dostepnosc"
        className="mt-3 inline-block text-sm text-indigo-700 underline-offset-2 hover:underline"
      >
        {t('settings.a11y.statement')}
      </a>
    </div>
  )
}
