import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { tileAriaLabel } from '../a11yLabels'
import { nextTrapIndex } from '../focusTrap'

const read = (name) => readFileSync(new URL(`../../${name}`, import.meta.url), 'utf-8')
const indexCss = read('index.css')
const a11yCss = read('a11y.css')

// Współczynnik kontrastu wg WCAG 2.2
function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

const vars = (block = '') =>
  Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))

// Kolory akcentu: domyślny (indigo) jest w :root, pozostałe w .accent-*, poprawki w a11y.css
const accentBlocks = { indigo: /:root\s*\{([^}]*)\}/.exec(indexCss)?.[1] }
for (const m of indexCss.matchAll(/\.accent-(\w+)\s*\{([^}]*)\}/g)) accentBlocks[m[1]] = m[2]

const accentFixes = {}
for (const m of a11yCss.matchAll(/html\.accent-(\w+)\s*\{([^}]*)\}/g)) accentFixes[m[1]] = vars(m[2])

const accent = (name) => ({ ...vars(accentBlocks[name]), ...(accentFixes[name] ?? {}) })
const ACCENTS = ['indigo', 'blue', 'emerald', 'rose', 'orange', 'violet']

// Kolory zmienne w motywach: wartości z index.css z poprawkami z a11y.css
const lightFixes = vars(/html:not\(\.dark\)\s*\{([^}]*)\}/.exec(a11yCss)?.[1])
const darkBase = vars(/^\.dark\s*\{([^}]*)\}/m.exec(indexCss)?.[1])
const darkFixes = vars(/html\.dark\s*\{([^}]*)\}/.exec(a11yCss)?.[1])
const dark = { ...darkBase, ...darkFixes }

const hcLight = vars(/html\.hc:not\(\.dark\)\s*\{([^}]*)\}/.exec(a11yCss)?.[1])
const hcDark = vars(/html\.hc\.dark\s*\{([^}]*)\}/.exec(a11yCss)?.[1])

// Tła (jasny motyw: domyślne kolory Tailwind; ciemny: po przemapowaniu w index.css)
const LIGHT_BACKGROUNDS = ['#ffffff', '#f8fafc', '#f1f5f9']
const DARK_BACKGROUNDS = [
  /\.dark \.bg-white\s*\{\s*background-color:\s*(#[0-9a-fA-F]{6})/.exec(indexCss)?.[1],
  darkBase['--color-slate-50'],
  darkBase['--color-slate-100'],
  '#0f172a', // tło strony (body) w ciemnym motywie
]

const expectContrast = (foreground, backgrounds, minimum) => {
  for (const background of backgrounds) {
    const ratio = contrast(foreground, background)
    expect(`${foreground} na ${background}: ${ratio >= minimum}`).toBe(
      `${foreground} na ${background}: true`
    )
  }
}

describe('kontrast kolorów (WCAG 2.2 AA)', () => {
  it('znajduje kolory w arkuszach stylów', () => {
    expect(Object.keys(accentBlocks).sort()).toEqual([...ACCENTS].sort())
    expect(lightFixes['--color-slate-400']).toBeDefined()
    expect(DARK_BACKGROUNDS.every(Boolean)).toBe(true)
  })

  it('każdy kolor akcentu: biały tekst na przycisku ma co najmniej 4,5:1', () => {
    for (const name of ACCENTS) {
      expectContrast(accent(name)['--accent-600'], ['#ffffff'], 4.5)
    }
  })

  it('każdy kolor akcentu: tekst w kolorze akcentu na jego jasnym tle ma co najmniej 4,5:1', () => {
    for (const name of ACCENTS) {
      const colors = accent(name)
      expectContrast(colors['--accent-600'], ['#ffffff', colors['--accent-50']], 4.5)
    }
  })

  it('jasny motyw: szary tekst pomocniczy ma co najmniej 4,5:1', () => {
    expectContrast(lightFixes['--color-slate-400'], LIGHT_BACKGROUNDS, 4.5)
    expectContrast(lightFixes['--color-slate-500'], LIGHT_BACKGROUNDS, 4.5)
    expectContrast('#475569', LIGHT_BACKGROUNDS, 4.5) // slate-600 (domyślny w Tailwind)
  })

  it('jasny motyw: zielony i bursztynowy tekst statusów ma co najmniej 4,5:1', () => {
    expectContrast(lightFixes['--color-green-600'], ['#ffffff', '#f0fdf4', '#dcfce7'], 4.5)
    expectContrast(lightFixes['--color-amber-600'], ['#ffffff', '#fffbeb', '#fef3c7'], 4.5)
  })

  it('ciemny motyw: tekst ma co najmniej 4,5:1 na wszystkich tłach', () => {
    for (const name of ['slate-400', 'slate-500', 'slate-600', 'green-600', 'amber-600', 'red-600']) {
      expectContrast(dark[`--color-${name}`], DARK_BACKGROUNDS, 4.5)
    }
    for (const name of ACCENTS) {
      expectContrast(accent(name)['--accent-400'], [DARK_BACKGROUNDS[0]], 4.5)
    }
  })

  it('obramowania pól formularzy mają co najmniej 3:1 w obu motywach', () => {
    const border = /:not\(:focus\)\s*\{\s*border-color:\s*(#[0-9a-fA-F]{6});/.exec(a11yCss)?.[1]
    expect(border).toBeDefined()
    expectContrast(border, ['#ffffff', ...DARK_BACKGROUNDS], 3)
  })

  it('tryb wysokiego kontrastu: tekst ma co najmniej 7:1', () => {
    for (const name of ['slate-400', 'slate-500', 'slate-600']) {
      expectContrast(hcLight[`--color-${name}`], ['#ffffff', '#f1f5f9'], 7)
      expectContrast(hcDark[`--color-${name}`], DARK_BACKGROUNDS, 7)
    }
  })
})

describe('opis kafelka zajęć dla czytników ekranu', () => {
  const event = {
    title: 'Algebra',
    day_of_week: 3,
    start_time: '10:15:00',
    end_time: '11:45:00',
    location: 'B-1 3.12',
    event_type: 'Wykład',
    teacher: 'dr Nowak',
  }

  it('zawiera przedmiot, osobę, dzień, godziny, miejsce, typ, prowadzącego i sprawdzian', () => {
    const block = { event, ownerName: 'Ola', watermark: 'Ola', marker: { label: 'Kolokwium 1' } }
    expect(tileAriaLabel(block)).toBe(
      'Algebra, osoba: Ola, środa 10:15–11:45, miejsce: B-1 3.12, Wykład, prowadzący: dr Nowak, sprawdzian: Kolokwium 1'
    )
  })

  it('pomija puste pola i obsługuje wybór zajęć dla sprawdzianu', () => {
    const minimal = {
      event: { title: 'Fizyka', day_of_week: 1, start_time: '08:00:00', end_time: '09:30:00' },
      ownerName: 'Ola',
    }
    expect(tileAriaLabel(minimal)).toBe('Fizyka, poniedziałek 08:00–09:30')
    expect(tileAriaLabel(minimal, { picker: true })).toBe(
      'Dodaj sprawdzian dla zajęć: Fizyka, poniedziałek 08:00–09:30'
    )
  })
})

describe('pułapka fokusu w oknach', () => {
  it('Tab na ostatnim elemencie wraca na pierwszy, Shift+Tab na pierwszym idzie na ostatni', () => {
    expect(nextTrapIndex({ count: 4, index: 3, shift: false })).toBe(0)
    expect(nextTrapIndex({ count: 4, index: 0, shift: true })).toBe(3)
  })

  it('w środku okna pozwala przeglądarce przejść dalej', () => {
    expect(nextTrapIndex({ count: 4, index: 1, shift: false })).toBeNull()
    expect(nextTrapIndex({ count: 4, index: 2, shift: true })).toBeNull()
  })

  it('gdy fokus jest poza oknem, wciąga go do środka', () => {
    expect(nextTrapIndex({ count: 4, index: -1, shift: false })).toBe(0)
    expect(nextTrapIndex({ count: 4, index: -1, shift: true })).toBe(3)
    expect(nextTrapIndex({ count: 0, index: -1, shift: false })).toBeNull()
  })
})