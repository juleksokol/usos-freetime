// Identyfikatory zakładek, kolorów, paneli i widoczności zajęć -> klucze tłumaczeń

export const TAB_LABEL_KEYS = {
  today: 'tabs.today',
  plan: 'tabs.plan',
  tests: 'tabs.tests',
  groups: 'tabs.groups',
  overlay: 'tabs.overlay',
  settings: 'tabs.settings',
}

export const ACCENT_LABEL_KEYS = {
  indigo: 'settings.accent.indigo',
  blue: 'settings.accent.blue',
  emerald: 'settings.accent.emerald',
  rose: 'settings.accent.rose',
  orange: 'settings.accent.orange',
  violet: 'settings.accent.violet',
}

export const VISIBILITY_LABEL_KEYS = {
  default: 'vis.default',
  busy: 'vis.busy',
  hidden: 'vis.hidden',
}

// Panele: nazwa, sposób opisu położenia („Zakładka …”) i zakładka, w której leżą
export const PANEL_META = {
  freeNow: { label: 'settings.panel.freeNow', where: 'settings.panel.whereTop', tab: 'tabs.today' },
  pushups: { label: 'settings.panel.pushups', where: 'settings.panel.where', tab: 'tabs.today' },
  upcomingTests: {
    label: 'settings.panel.upcomingTests',
    where: 'settings.panel.where',
    tab: 'tabs.today',
  },
  todaySlots: { label: 'settings.panel.todaySlots', where: 'settings.panel.where', tab: 'tabs.today' },
  todayPeople: {
    label: 'settings.panel.todayPeople',
    where: 'settings.panel.where',
    tab: 'tabs.today',
  },
  customEvents: {
    label: 'settings.panel.customEvents',
    where: 'settings.panel.where',
    tab: 'tabs.plan',
  },
  import: { label: 'settings.panel.import', where: 'settings.panel.where', tab: 'tabs.plan' },
  overlaySlots: {
    label: 'settings.panel.overlaySlots',
    where: 'settings.panel.whereBelow',
    tab: 'tabs.overlay',
  },
}
