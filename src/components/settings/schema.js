import {
  Accessibility,
  Bell,
  CalendarDays,
  Download,
  Dumbbell,
  KeyRound,
  Languages,
  LayoutDashboard,
  Palette,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Trash2,
  User,
  Utensils,
} from 'lucide-react'
import { ACCENT_LABEL_KEYS, TAB_LABEL_KEYS } from '../../lib/labelKeys'
import { TAB_OPTIONS } from '../../lib/settingsDefaults'

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
const hours = (from, to) =>
  range(from, to).map((hour) => ({ value: hour, label: `${hour}:00` }))

const THEME_KEYS = {
  system: 'settings.opt.theme.system',
  light: 'settings.opt.theme.light',
  dark: 'settings.opt.theme.dark',
}

/**
 * Opis wszystkich ustawień (grupy -> sekcje -> wiersze). Teksty to klucze tłumaczeń
 * (titleKey, descriptionKey, keywordsKey, labelKey, hintKey).
 *
 * Wiersz: { key, type, labelKey, hintKey?, options?, number?, min?, max?, patch? }
 *   type: 'switch' | 'segmented' | 'select' | 'number' | 'date' | 'swatches' | 'palette'
 *   options: lista { value, labelKey | label } albo funkcja (ustawienia) => lista
 *   patch(value, ustawienia): zwraca zmiany do zapisania (gdy jedna opcja zależy od drugiej)
 * Sekcja: { id, titleKey, descriptionKey, keywordsKey, icon, summary?, rows?, extra?, custom? }
 *   summary(ustawienia, t): krótkie podsumowanie w nagłówku sekcji
 *   extra: dodatkowa zawartość pod wierszami; custom: cała zawartość sekcji jest własna
 */
export const SETTINGS_GROUPS = [
  {
    id: 'look',
    titleKey: 'settings.group.look',
    sections: [
      {
        id: 'appearance',
        titleKey: 'settings.sec.appearance.title',
        descriptionKey: 'settings.sec.appearance.desc',
        keywordsKey: 'settings.sec.appearance.kw',
        icon: Palette,
        summary: (s, t) =>
          `${t(THEME_KEYS[s.theme] ?? THEME_KEYS.system)} · ${t(
            ACCENT_LABEL_KEYS[s.accent] ?? ACCENT_LABEL_KEYS.indigo
          )}`,
        rows: [
          {
            key: 'theme',
            type: 'segmented',
            labelKey: 'settings.row.theme.label',
            options: [
              { value: 'system', labelKey: 'settings.opt.theme.system' },
              { value: 'light', labelKey: 'settings.opt.theme.light' },
              { value: 'dark', labelKey: 'settings.opt.theme.dark' },
            ],
          },
          { key: 'accent', type: 'swatches', labelKey: 'settings.row.accent.label' },
          {
            key: 'fontScale',
            type: 'segmented',
            labelKey: 'settings.row.fontScale.label',
            options: [
              { value: 'small', labelKey: 'settings.opt.font.small' },
              { value: 'normal', labelKey: 'settings.opt.font.normal' },
              { value: 'large', labelKey: 'settings.opt.font.large' },
            ],
          },
          {
            key: 'density',
            type: 'segmented',
            labelKey: 'settings.row.density.label',
            hintKey: 'settings.row.density.hint',
            options: [
              { value: 'compact', labelKey: 'settings.opt.density.compact' },
              { value: 'normal', labelKey: 'settings.opt.density.normal' },
              { value: 'spacious', labelKey: 'settings.opt.density.spacious' },
            ],
          },
          {
            key: 'personPalette',
            type: 'palette',
            labelKey: 'settings.row.personPalette.label',
            hintKey: 'settings.row.personPalette.hint',
            options: [
              { value: 'standard', labelKey: 'settings.opt.palette.standard' },
              { value: 'colorblind', labelKey: 'settings.opt.palette.colorblind' },
              { value: 'pastel', labelKey: 'settings.opt.palette.pastel' },
            ],
          },
          {
            key: 'animations',
            type: 'switch',
            labelKey: 'settings.row.animations.label',
            hintKey: 'settings.row.animations.hint',
          },
        ],
      },
      {
        // Nazwa sekcji jest dwujęzyczna, więc nie korzysta z tłumaczeń
        id: 'language',
        title: 'Język / Language',
        description: 'Polski lub English. / Polish or English.',
        keywords: 'język language polski angielski english polish tłumaczenie',
        icon: Languages,
        custom: 'language',
      },
      {
        id: 'accessibility',
        titleKey: 'settings.sec.accessibility.title',
        descriptionKey: 'settings.sec.accessibility.desc',
        keywordsKey: 'settings.sec.accessibility.kw',
        icon: Accessibility,
        summary: (s, t) =>
          [
            s.highContrast && t('settings.sum.contrast'),
            s.largeTargets && t('settings.sum.targets'),
            s.textSpacing && t('settings.sum.spacing'),
          ]
            .filter(Boolean)
            .join(', ') || t('settings.sum.default'),
        rows: [
          {
            key: 'highContrast',
            type: 'switch',
            labelKey: 'settings.row.highContrast.label',
            hintKey: 'settings.row.highContrast.hint',
          },
          {
            key: 'largeTargets',
            type: 'switch',
            labelKey: 'settings.row.largeTargets.label',
            hintKey: 'settings.row.largeTargets.hint',
          },
          {
            key: 'textSpacing',
            type: 'switch',
            labelKey: 'settings.row.textSpacing.label',
            hintKey: 'settings.row.textSpacing.hint',
          },
        ],
        extra: 'a11y',
      },
      {
        id: 'layout',
        titleKey: 'settings.sec.layout.title',
        descriptionKey: 'settings.sec.layout.desc',
        keywordsKey: 'settings.sec.layout.kw',
        icon: LayoutDashboard,
        summary: (s, t) =>
          t('settings.sum.layout', {
            tabs: s.hiddenTabs.length,
            panels: s.hiddenPanels.filter((id) => id !== 'now').length,
          }),
        rows: [
          {
            key: 'startTab',
            type: 'select',
            labelKey: 'settings.row.startTab.label',
            options: [
              { value: 'last', labelKey: 'settings.opt.startTab.last' },
              ...TAB_OPTIONS.map((tab) => ({ value: tab.id, labelKey: TAB_LABEL_KEYS[tab.id] })),
            ],
          },
          {
            key: 'showQuickLinks',
            type: 'switch',
            labelKey: 'settings.row.showQuickLinks.label',
            hintKey: 'settings.row.showQuickLinks.hint',
          },
        ],
        extra: 'layout',
      },
    ],
  },
  {
    id: 'plan',
    titleKey: 'settings.group.plan',
    sections: [
      {
        id: 'grid',
        titleKey: 'settings.sec.grid.title',
        descriptionKey: 'settings.sec.grid.desc',
        keywordsKey: 'settings.sec.grid.kw',
        icon: CalendarDays,
        summary: (s, t) =>
          `${s.gridStartHour}:00–${s.gridEndHour}:00${s.showWeekend ? t('settings.sum.weekend') : ''}`,
        rows: [
          {
            key: 'gridStartHour',
            type: 'select',
            number: true,
            labelKey: 'settings.row.gridStartHour.label',
            options: hours(5, 12),
          },
          {
            key: 'gridEndHour',
            type: 'select',
            number: true,
            labelKey: 'settings.row.gridEndHour.label',
            options: hours(14, 24),
          },
          {
            key: 'showWeekend',
            type: 'switch',
            labelKey: 'settings.row.showWeekend.label',
            hintKey: 'settings.row.showWeekend.hint',
          },
          {
            key: 'showNowLine',
            type: 'switch',
            labelKey: 'settings.row.showNowLine.label',
            hintKey: 'settings.row.showNowLine.hint',
          },
          {
            key: 'autoScrollNow',
            type: 'switch',
            labelKey: 'settings.row.autoScrollNow.label',
            hintKey: 'settings.row.autoScrollNow.hint',
          },
          {
            key: 'swipeNav',
            type: 'switch',
            labelKey: 'settings.row.swipeNav.label',
            hintKey: 'settings.row.swipeNav.hint',
          },
        ],
      },
      {
        id: 'tiles',
        titleKey: 'settings.sec.tiles.title',
        descriptionKey: 'settings.sec.tiles.desc',
        keywordsKey: 'settings.sec.tiles.kw',
        icon: SlidersHorizontal,
        summary: (s, t) =>
          [
            s.showTypeWatermark && t('settings.sum.letters'),
            s.tileShowTeacher && t('settings.sum.teacher'),
            s.useAbbreviations && t('settings.sum.abbr'),
          ]
            .filter(Boolean)
            .join(', ') || t('settings.sum.minimal'),
        rows: [
          {
            key: 'showTypeWatermark',
            type: 'switch',
            labelKey: 'settings.row.showTypeWatermark.label',
            hintKey: 'settings.row.showTypeWatermark.hint',
          },
          { key: 'tileShowTime', type: 'switch', labelKey: 'settings.row.tileShowTime.label' },
          {
            key: 'tileShowLocation',
            type: 'switch',
            labelKey: 'settings.row.tileShowLocation.label',
          },
          {
            key: 'tileShowTeacher',
            type: 'switch',
            labelKey: 'settings.row.tileShowTeacher.label',
            hintKey: 'settings.row.tileShowTeacher.hint',
          },
          {
            key: 'useAbbreviations',
            type: 'switch',
            labelKey: 'settings.row.useAbbreviations.label',
            hintKey: 'settings.row.useAbbreviations.hint',
          },
          {
            key: 'showWatermark',
            type: 'switch',
            labelKey: 'settings.row.showWatermark.label',
            hintKey: 'settings.row.showWatermark.hint',
          },
          { key: 'showLegend', type: 'switch', labelKey: 'settings.row.showLegend.label' },
          {
            key: 'highlightCustom',
            type: 'switch',
            labelKey: 'settings.row.highlightCustom.label',
            hintKey: 'settings.row.highlightCustom.hint',
          },
        ],
      },
      {
        id: 'subjects',
        titleKey: 'settings.sec.subjects.title',
        descriptionKey: 'settings.sec.subjects.desc',
        keywordsKey: 'settings.sec.subjects.kw',
        icon: Tag,
        custom: 'subjects',
      },
    ],
  },
  {
    id: 'features',
    titleKey: 'settings.group.features',
    sections: [
      {
        id: 'slots',
        titleKey: 'settings.sec.slots.title',
        descriptionKey: 'settings.sec.slots.desc',
        keywordsKey: 'settings.sec.slots.kw',
        icon: Utensils,
        summary: (s, t) =>
          `${s.minDuration} min${
            s.lunchOnly ? t('settings.sum.lunch', { from: s.lunchStart, to: s.lunchEnd }) : ''
          }`,
        rows: [
          {
            key: 'minDuration',
            type: 'select',
            number: true,
            labelKey: 'settings.row.minDuration.label',
            options: [30, 45, 60, 90].map((minutes) => ({
              value: minutes,
              label: `${minutes} min`,
            })),
          },
          {
            key: 'lunchOnly',
            type: 'switch',
            labelKey: 'settings.row.lunchOnly.label',
            hintKey: 'settings.row.lunchOnly.hint',
          },
          {
            key: 'lunchStart',
            type: 'select',
            number: true,
            labelKey: 'settings.row.lunchStart.label',
            options: hours(9, 14),
            patch: (value, s) => ({
              lunchStart: value,
              lunchEnd: Math.max(s.lunchEnd, value + 1),
            }),
          },
          {
            key: 'lunchEnd',
            type: 'select',
            number: true,
            labelKey: 'settings.row.lunchEnd.label',
            options: (s) => hours(10, 18).filter((option) => option.value > s.lunchStart),
          },
          {
            key: 'testsCountAsBusy',
            type: 'switch',
            labelKey: 'settings.row.testsCountAsBusy.label',
            hintKey: 'settings.row.testsCountAsBusy.hint',
          },
        ],
      },
      {
        id: 'tests',
        titleKey: 'settings.sec.tests.title',
        descriptionKey: 'settings.sec.tests.desc',
        keywordsKey: 'settings.sec.tests.kw',
        icon: Bell,
        summary: (s, t) =>
          s.remindersEnabled
            ? t('settings.sum.remindersFrom', { hour: s.reminderHour })
            : t('settings.sum.remindersOff'),
        rows: [
          {
            key: 'showTestsOnPlan',
            type: 'switch',
            labelKey: 'settings.row.showTestsOnPlan.label',
            hintKey: 'settings.row.showTestsOnPlan.hint',
          },
          {
            key: 'showExamDots',
            type: 'switch',
            labelKey: 'settings.row.showExamDots.label',
            hintKey: 'settings.row.showExamDots.hint',
          },
          {
            key: 'remindersEnabled',
            type: 'switch',
            labelKey: 'settings.row.remindersEnabled.label',
            hintKey: 'settings.row.remindersEnabled.hint',
          },
          {
            key: 'reminderHour',
            type: 'select',
            number: true,
            labelKey: 'settings.row.reminderHour.label',
            options: hours(12, 12).concat(hours(14, 14), hours(16, 22)),
          },
        ],
        extra: 'notifications',
      },
      {
        id: 'pushups',
        titleKey: 'settings.sec.pushups.title',
        descriptionKey: 'settings.sec.pushups.desc',
        keywordsKey: 'settings.sec.pushups.kw',
        icon: Dumbbell,
        summary: (s, t) =>
          t('settings.sum.pushups', { start: s.pushupsStartCount, inc: s.pushupsWeeklyIncrement }),
        rows: [
          { key: 'pushupsStartDate', type: 'date', labelKey: 'settings.row.pushupsStartDate.label' },
          {
            key: 'pushupsStartCount',
            type: 'number',
            min: 0,
            max: 999,
            labelKey: 'settings.row.pushupsStartCount.label',
          },
          {
            key: 'pushupsWeeklyIncrement',
            type: 'number',
            min: 0,
            max: 100,
            labelKey: 'settings.row.pushupsWeeklyIncrement.label',
          },
        ],
      },
    ],
  },
  {
    id: 'account',
    titleKey: 'settings.group.account',
    sections: [
      {
        id: 'profile',
        titleKey: 'settings.sec.profile.title',
        descriptionKey: 'settings.sec.profile.desc',
        keywordsKey: 'settings.sec.profile.kw',
        icon: User,
        custom: 'profile',
      },
      {
        id: 'password',
        titleKey: 'settings.sec.password.title',
        descriptionKey: 'settings.sec.password.desc',
        keywordsKey: 'settings.sec.password.kw',
        icon: KeyRound,
        custom: 'password',
      },
      {
        id: 'privacy',
        titleKey: 'settings.sec.privacy.title',
        descriptionKey: 'settings.sec.privacy.desc',
        keywordsKey: 'settings.sec.privacy.kw',
        icon: ShieldCheck,
        custom: 'privacy',
      },
      {
        id: 'export',
        titleKey: 'settings.sec.export.title',
        descriptionKey: 'settings.sec.export.desc',
        keywordsKey: 'settings.sec.export.kw',
        icon: Download,
        custom: 'export',
      },
      {
        id: 'reset',
        titleKey: 'settings.sec.reset.title',
        descriptionKey: 'settings.sec.reset.desc',
        keywordsKey: 'settings.sec.reset.kw',
        icon: RotateCcw,
        custom: 'reset',
      },
      {
        id: 'danger',
        titleKey: 'settings.sec.danger.title',
        descriptionKey: 'settings.sec.danger.desc',
        keywordsKey: 'settings.sec.danger.kw',
        icon: Trash2,
        custom: 'danger',
      },
    ],
  },
]
