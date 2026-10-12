import { useMemo } from 'react'
import { Palette, SlidersHorizontal } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { getPalette } from '../lib/constants'
import { suggestAbbreviation } from '../lib/subjects'
import { Row, Section, Switch, selectClass } from './SettingsControls'

/**
 * subjects: lista nazw przedmiotów z Twojego planu
 */
export default function PlanSettings({ subjects }) {
  const { settings, updateSettings } = useSettings()

  const set = (key) => (value) => updateSettings({ [key]: value })
  const defaultColor = getPalette(settings.personPalette)[0]
  const styles = useMemo(() => settings.subjectStyles ?? {}, [settings.subjectStyles])

  // Zapisuje styl przedmiotu; pusty styl (bez koloru i skrótu) jest usuwany
  const setStyle = (subject, patch) => {
    const merged = { ...(styles[subject] ?? {}), ...patch }
    if (!merged.color) delete merged.color
    if (!merged.abbr) delete merged.abbr

    const next = { ...styles }
    if (Object.keys(merged).length === 0) {
      delete next[subject]
    } else {
      next[subject] = merged
    }
    updateSettings({ subjectStyles: next })
  }

  // Proponuje skróty dla przedmiotów, które jeszcze ich nie mają (bez powtórzeń)
  const suggestAll = () => {
    const taken = new Set(
      Object.values(styles)
        .map((style) => style.abbr)
        .filter(Boolean)
    )
    const next = { ...styles }

    for (const subject of subjects) {
      if (next[subject]?.abbr) continue
      const abbr = suggestAbbreviation(subject, taken)
      taken.add(abbr)
      next[subject] = { ...(next[subject] ?? {}), abbr }
    }

    updateSettings({ subjectStyles: next })
  }

  const clearAll = () => {
    if (!window.confirm('Usunąć wszystkie własne kolory i skróty przedmiotów?')) return
    updateSettings({ subjectStyles: {} })
  }

  const buttonClass =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100'

  return (
    <>
      <Section
        icon={SlidersHorizontal}
        title="Plan: linia „teraz”, gesty i skróty"
        description="Dodatkowe ustawienia siatki planu."
      >
        <Row label="Linia „teraz” na siatce" hint="Czerwona linia w dzisiejszej kolumnie.">
          <Switch checked={settings.showNowLine} onChange={set('showNowLine')} label="Linia teraz" />
        </Row>

        <Row
          label="Przewijaj do bieżącej godziny"
          hint="Po wejściu na plan strona przewija się do linii „teraz”."
        >
          <Switch checked={settings.autoScrollNow} onChange={set('autoScrollNow')} label="Autoprzewijanie" />
        </Row>

        <Row
          label="Przesuwanie palcem między tygodniami i dniami"
          hint="Gest w bok na telefonie zmienia tydzień albo dzień."
        >
          <Switch checked={settings.swipeNav} onChange={set('swipeNav')} label="Gesty" />
        </Row>

        <Row
          label="Skróty przedmiotów na kafelkach"
          hint="Zamiast pełnej nazwy kafelek pokazuje ustawiony niżej skrót."
        >
          <Switch checked={settings.useAbbreviations} onChange={set('useAbbreviations')} label="Skróty" />
        </Row>
      </Section>

      <Section
        icon={Palette}
        title="Kolory i skróty przedmiotów"
        description="Kolor działa na Twoim planie (na wspólnym planie kolory oznaczają osoby), a skrót widać wszędzie."
      >
        {subjects.length === 0 ? (
          <p className="py-3 text-sm text-slate-500">
            Najpierw zaimportuj plan, a przedmioty pojawią się tutaj.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 py-3">
              <button onClick={suggestAll} className={buttonClass}>
                Zaproponuj skróty
              </button>
              <button onClick={clearAll} className={buttonClass}>
                Wyczyść wszystko
              </button>
            </div>

            {subjects.map((subject) => {
              const style = styles[subject] ?? {}

              return (
                <div
                  key={subject}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <input
                    type="color"
                    value={style.color ?? defaultColor}
                    onChange={(e) => setStyle(subject, { color: e.target.value })}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-0.5"
                    aria-label={`Kolor: ${subject}`}
                    title="Kolor przedmiotu"
                  />
                  <span className="min-w-0 flex-1 basis-40 text-sm text-slate-800">
                    {subject}
                  </span>
                  <input
                    type="text"
                    value={style.abbr ?? ''}
                    onChange={(e) => setStyle(subject, { abbr: e.target.value.slice(0, 6) })}
                    placeholder="Skrót"
                    maxLength={6}
                    className={`${selectClass} w-24`}
                    aria-label={`Skrót: ${subject}`}
                  />
                  <button
                    onClick={() => setStyle(subject, { color: null, abbr: null })}
                    disabled={!style.color && !style.abbr}
                    className="text-sm text-slate-500 transition hover:text-slate-800 disabled:opacity-40"
                  >
                    Resetuj
                  </button>
                </div>
              )
            })}
          </>
        )}
      </Section>
    </>
  )
}