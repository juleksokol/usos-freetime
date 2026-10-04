export const DAY_NAMES = [
  '',
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
]

// Dni widoczne na siatce (1 = poniedziałek ... 7 = niedziela)
export const WORKDAYS = [1, 2, 3, 4, 5]
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

// Domyślny zakres godzin siatki
export const GRID_START_HOUR = 8
export const GRID_END_HOUR = 20

// Wysokość jednej godziny na siatce (w pikselach) zależnie od wybranej gęstości
export const HOUR_HEIGHT = 56
export const DENSITY_HOUR_HEIGHT = { compact: 44, normal: 56, spacious: 72 }

// Palety kolorów osób przy nakładaniu planów
export const PERSON_PALETTES = {
  standard: [
    '#6366f1', // indygo
    '#ef4444', // czerwony
    '#f59e0b', // bursztynowy
    '#0ea5e9', // niebieski
    '#ec4899', // różowy
    '#8b5cf6', // fioletowy
    '#f97316', // pomarańczowy
    '#78716c', // szary
  ],
  // paleta Okabe-Ito, czytelna także przy zaburzeniach widzenia barw
  colorblind: [
    '#0072B2',
    '#E69F00',
    '#009E73',
    '#D55E00',
    '#CC79A7',
    '#56B4E9',
    '#F0E442',
    '#999999',
  ],
  pastel: [
    '#818cf8',
    '#fb7185',
    '#fbbf24',
    '#38bdf8',
    '#f472b6',
    '#a78bfa',
    '#fb923c',
    '#a8a29e',
  ],
}

export const PERSON_COLORS = PERSON_PALETTES.standard

export function getPalette(name) {
  return PERSON_PALETTES[name] ?? PERSON_PALETTES.standard
}