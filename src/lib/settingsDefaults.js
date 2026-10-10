export const DEFAULT_SETTINGS = {
  // Wygląd
  theme: 'system', // 'system' | 'light' | 'dark'
  accent: 'indigo',
  fontScale: 'normal', // 'small' | 'normal' | 'large'
  density: 'normal', // 'compact' | 'normal' | 'spacious'
  personPalette: 'standard', // 'standard' | 'colorblind' | 'pastel'
  animations: true,

  // Siatka planu
  gridStartHour: 8,
  gridEndHour: 20,
  showWeekend: false,
  showWatermark: true,
  showLegend: true,
  tileShowTime: true,
  tileShowLocation: true,
  highlightCustom: true,

  // Kolokwia i powiadomienia
  showTestsOnPlan: true,
  showExamDots: true,
  remindersEnabled: true,
  reminderHour: 18,

  // Układ aplikacji
  startTab: 'last', // 'last' albo id zakładki
  hiddenTabs: [],
  hiddenPanels: [],

  // Wspólne okienka
  minDuration: 45,
  lunchOnly: false,
  lunchStart: 11,
  lunchEnd: 16,

  // Licznik pompek
  pushupsStartDate: '2026-10-04',
  pushupsStartCount: 30,
  pushupsWeeklyIncrement: 5,
}

export const TAB_OPTIONS = [
  { id: 'today', label: 'Dziś' },
  { id: 'plan', label: 'Mój plan' },
  { id: 'tests', label: 'Kolokwia' },
  { id: 'groups', label: 'Grupy' },
  { id: 'overlay', label: 'Wspólne okienka' },
]

export const PANEL_OPTIONS = [
  { id: 'pushups', label: 'Licznik pompek', hint: 'Zakładka „Dziś”' },
  {
    id: 'upcomingTests',
    label: 'Nadchodzące sprawdziany',
    hint: 'Zakładka „Dziś”',
  },
  { id: 'now', label: 'Status „Teraz”', hint: 'Zakładka „Dziś”' },
  { id: 'todaySlots', label: 'Wspólne okienka dnia', hint: 'Zakładka „Dziś”' },
  { id: 'todayPeople', label: 'Listy zajęć osób', hint: 'Zakładka „Dziś”' },
  { id: 'customEvents', label: 'Własne wydarzenia', hint: 'Zakładka „Mój plan”' },
  { id: 'import', label: 'Import planu', hint: 'Zakładka „Mój plan”' },
  {
    id: 'overlaySlots',
    label: 'Lista wspólnych okienek',
    hint: 'Zakładka „Wspólne okienka”, pod siatką',
  },
]

export const ACCENT_OPTIONS = [
  { id: 'indigo', label: 'Indygo', color: '#4f46e5' },
  { id: 'blue', label: 'Niebieski', color: '#2563eb' },
  { id: 'emerald', label: 'Szmaragdowy', color: '#059669' },
  { id: 'rose', label: 'Różowy', color: '#e11d48' },
  { id: 'orange', label: 'Pomarańczowy', color: '#ea580c' },
  { id: 'violet', label: 'Fioletowy', color: '#7c3aed' },
]