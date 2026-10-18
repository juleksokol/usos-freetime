import {
  Bell,
  CalendarDays,
  Download,
  Dumbbell,
  KeyRound,
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
import { ACCENT_OPTIONS, PANEL_OPTIONS, TAB_OPTIONS } from '../../lib/settingsDefaults'

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
const hours = (from, to) =>
  range(from, to).map((hour) => ({ value: hour, label: `${hour}:00` }))

const THEME_LABELS = { system: 'Systemowy', light: 'Jasny', dark: 'Ciemny' }

const tabAndPanelWords = [...TAB_OPTIONS, ...PANEL_OPTIONS]
  .map((item) => item.label)
  .join(' ')

/**
 * Opis wszystkich ustawień (grupy -> sekcje -> wiersze).
 *
 * Wiersz: { key, type, label, hint?, options?, number?, min?, max?, patch? }
 *   type: 'switch' | 'segmented' | 'select' | 'number' | 'date' | 'swatches' | 'palette'
 *   options: lista { value, label } albo funkcja (ustawienia) => lista
 *   patch(value, ustawienia): zwraca zmiany do zapisania (gdy jedna opcja zależy od drugiej)
 * Sekcja: { id, title, description, icon, keywords, summary?, rows?, extra?, custom? }
 *   extra: dodatkowa zawartość pod wierszami; custom: cała zawartość sekcji jest własna
 */
export const SETTINGS_GROUPS = [
  {
    id: 'look',
    title: 'Wygląd i układ',
    sections: [
      {
        id: 'appearance',
        title: 'Motyw i kolory',
        description: 'Jasny lub ciemny motyw, kolor akcentu, rozmiar tekstu.',
        icon: Palette,
        keywords:
          'wygląd motyw ciemny jasny kolor akcent tekst czcionka paleta osób gęstość animacje',
        summary: (s) =>
          `${THEME_LABELS[s.theme] ?? s.theme} · ${
            ACCENT_OPTIONS.find((item) => item.id === s.accent)?.label ?? s.accent
          }`,
        rows: [
          {
            key: 'theme',
            type: 'segmented',
            label: 'Motyw',
            options: [
              { value: 'system', label: 'Systemowy' },
              { value: 'light', label: 'Jasny' },
              { value: 'dark', label: 'Ciemny' },
            ],
          },
          { key: 'accent', type: 'swatches', label: 'Kolor akcentu' },
          {
            key: 'fontScale',
            type: 'segmented',
            label: 'Rozmiar tekstu',
            options: [
              { value: 'small', label: 'Mały' },
              { value: 'normal', label: 'Normalny' },
              { value: 'large', label: 'Duży' },
            ],
          },
          {
            key: 'density',
            type: 'segmented',
            label: 'Gęstość siatki',
            hint: 'Wysokość jednej godziny na planie.',
            options: [
              { value: 'compact', label: 'Kompaktowa' },
              { value: 'normal', label: 'Normalna' },
              { value: 'spacious', label: 'Przestronna' },
            ],
          },
          {
            key: 'personPalette',
            type: 'palette',
            label: 'Paleta kolorów osób',
            hint: 'Kolory, którymi oznaczone są osoby na wspólnym planie.',
            options: [
              { value: 'standard', label: 'Standardowa' },
              { value: 'colorblind', label: 'Dla daltonistów' },
              { value: 'pastel', label: 'Pastelowa' },
            ],
          },
          {
            key: 'animations',
            type: 'switch',
            label: 'Animacje',
            hint: 'Wyłączenie ułatwia pracę na wolniejszych urządzeniach. Szanujemy też systemowe „ogranicz ruch”.',
          },
        ],
      },
      {
        id: 'layout',
        title: 'Układ aplikacji',
        description: 'Zakładka startowa oraz widoczność zakładek i paneli.',
        icon: LayoutDashboard,
        keywords: `układ zakładki panele ukryj pokaż start przesuwanie ołówek ${tabAndPanelWords}`,
        summary: (s) =>
          `ukryte: ${s.hiddenTabs.length} zakładek, ${
            s.hiddenPanels.filter((id) => id !== 'now').length
          } paneli`,
        rows: [
          {
            key: 'startTab',
            type: 'select',
            label: 'Zakładka startowa',
            options: [
              { value: 'last', label: 'Ostatnio używana' },
              ...TAB_OPTIONS.map((tab) => ({ value: tab.id, label: tab.label })),
            ],
          },
                  {
            key: 'showQuickLinks',
            type: 'switch',
            label: 'Szybkie linki w nagłówku',
            hint: 'Przyciski z linkami (UPeL, Syllabus, poczta…) obok logo, a na telefonie przycisk z siatką. Wyłączenie tylko je ukrywa, zapisane linki zostają.',
          },
        ],
        extra: 'layout',
      },
    ],
  },
  {
    id: 'plan',
    title: 'Plan zajęć',
    sections: [
      {
        id: 'grid',
        title: 'Siatka tygodnia',
        description: 'Godziny, weekend, linia „teraz” i gesty.',
        icon: CalendarDays,
        keywords:
          'siatka godziny weekend sobota niedziela linia teraz przewijanie gesty przesuwanie palcem tydzień dzień',
        summary: (s) =>
          `${s.gridStartHour}:00–${s.gridEndHour}:00${s.showWeekend ? ' · z weekendem' : ''}`,
        rows: [
          {
            key: 'gridStartHour',
            type: 'select',
            number: true,
            label: 'Pierwsza godzina siatki',
            options: hours(5, 12),
          },
          {
            key: 'gridEndHour',
            type: 'select',
            number: true,
            label: 'Ostatnia godzina siatki',
            options: hours(14, 24),
          },
          {
            key: 'showWeekend',
            type: 'switch',
            label: 'Sobota i niedziela',
            hint: 'Dodatkowe kolumny na siatce i w okienkach.',
          },
          {
            key: 'showNowLine',
            type: 'switch',
            label: 'Linia „teraz”',
            hint: 'Czerwona linia w dzisiejszej kolumnie.',
          },
          {
            key: 'autoScrollNow',
            type: 'switch',
            label: 'Przewijaj do bieżącego dnia i godziny',
            hint: 'Po wejściu na plan siatka ustawia się na linii „teraz”, a na telefonie także na dzisiejszym dniu.',
          },
          {
            key: 'swipeNav',
            type: 'switch',
            label: 'Przesuwanie palcem między tygodniami i dniami',
            hint: 'Gest w bok na telefonie zmienia tydzień albo dzień.',
          },
        ],
      },
      {
        id: 'tiles',
        title: 'Kafelki zajęć',
        description: 'Co pokazują kafelki: litera typu, prowadzący, skróty.',
        icon: SlidersHorizontal,
        keywords:
          'kafelki litera typ wykład ćwiczenia laboratorium projekt seminarium konwersatorium zdalne prowadzący skróty godziny sala znak wodny pseudonim legenda wydarzenia',
        summary: (s) =>
          [
            s.showTypeWatermark && 'litery',
            s.tileShowTeacher && 'prowadzący',
            s.useAbbreviations && 'skróty',
          ]
            .filter(Boolean)
            .join(', ') || 'minimalne',
        rows: [
          {
            key: 'showTypeWatermark',
            type: 'switch',
            label: 'Litera typu zajęć',
            hint: 'Bardzo blady znak wodny: W wykład, Ć ćwiczenia, L laboratorium (ciemniejszy odcień), P projekt, S seminarium, K konwersatorium, Z zajęcia zdalne.',
          },
          { key: 'tileShowTime', type: 'switch', label: 'Godziny na kafelkach' },
          { key: 'tileShowLocation', type: 'switch', label: 'Miejsce (sala) na kafelkach' },
          {
            key: 'tileShowTeacher',
            type: 'switch',
            label: 'Prowadzący na kafelkach',
            hint: 'Widoczny na Twoim planie, gdy kafelek jest dość wysoki.',
          },
          {
            key: 'useAbbreviations',
            type: 'switch',
            label: 'Skróty przedmiotów',
            hint: 'Skrót pojawia się tylko wtedy, gdy pełna nazwa nie mieści się na kafelku w dwóch liniach.',
          },
          {
            key: 'showWatermark',
            type: 'switch',
            label: 'Pseudonim jako znak wodny',
            hint: 'Na wspólnym planie: do kogo należą zajęcia.',
          },
          { key: 'showLegend', type: 'switch', label: 'Legenda osób nad planem' },
          {
            key: 'highlightCustom',
            type: 'switch',
            label: 'Wyróżniaj własne wydarzenia',
            hint: 'Przerywana ramka i ukośny wzór na kafelkach.',
          },
        ],
      },
      {
        id: 'subjects',
        title: 'Kolory i skróty przedmiotów',
        description: 'Własny kolor i skrót dla każdego przedmiotu.',
        icon: Tag,
        keywords: 'kolory skróty przedmioty kolor przedmiotu skrót nazwa',
        custom: 'subjects',
      },
    ],
  },
  {
    id: 'features',
    title: 'Okienka, sprawdziany i wyzwanie',
    sections: [
      {
        id: 'slots',
        title: 'Wspólne okienka',
        description: 'Domyślne ustawienia wyszukiwania okienek.',
        icon: Utensils,
        keywords: 'okienka wspólne minimalna długość pora obiadu obiad lunch',
        summary: (s) =>
          `${s.minDuration} min${s.lunchOnly ? ` · obiad ${s.lunchStart}–${s.lunchEnd}` : ''}`,
        rows: [
          {
            key: 'minDuration',
            type: 'select',
            number: true,
            label: 'Minimalna długość okienka',
            options: [30, 45, 60, 90].map((minutes) => ({
              value: minutes,
              label: `${minutes} min`,
            })),
          },
          {
            key: 'lunchOnly',
            type: 'switch',
            label: 'Tylko pora obiadu',
            hint: 'Szukaj okienek tylko w oknie czasu poniżej.',
          },
          {
            key: 'lunchStart',
            type: 'select',
            number: true,
            label: 'Pora obiadu: od',
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
            label: 'Pora obiadu: do',
                       options: (s) => hours(10, 18).filter((option) => option.value > s.lunchStart),
          },
          {
            key: 'testsCountAsBusy',
            type: 'switch',
            label: 'Moje sprawdziany jako zajęty czas',
            hint: 'Wspólne okienka omijają godziny, w których masz kolokwium lub egzamin. Dotyczy tylko Ciebie: sprawdziany widzisz tylko Ty, więc znajomi ich nie uwzględnią.',
          },
        ],
      },
      {
        id: 'tests',
        title: 'Sprawdziany i powiadomienia',
        description: 'Jak pokazywać sprawdziany i kiedy o nich przypominać.',
        icon: Bell,
        keywords:
          'sprawdziany kolokwia egzaminy kropki przypomnienia powiadomienia godzina przypomnienia',
        summary: (s) =>
          s.remindersEnabled ? `przypomnienia od ${s.reminderHour}:00` : 'przypomnienia wyłączone',
        rows: [
          {
            key: 'showTestsOnPlan',
            type: 'switch',
            label: 'Sprawdziany na moim planie',
            hint: 'Kolorowe kafelki (egzamin czerwony, kolokwium pomarańczowe, reszta zielona). Po wyłączeniu zobaczysz je jako kropki na zajęciach.',
          },
          {
            key: 'showExamDots',
            type: 'switch',
            label: 'Kropki sprawdzianów na wspólnym planie',
            hint: 'Mała kropka w rogu zajęć z przedmiotu, z którego masz w tym tygodniu sprawdzian. Widzisz ją tylko Ty.',
          },
          {
            key: 'remindersEnabled',
            type: 'switch',
            label: 'Przypomnienia o sprawdzianach',
            hint: 'Dzień przed od wybranej godziny oraz rano w dniu sprawdzianu, gdy aplikacja jest otwarta lub działa w tle.',
          },
          {
            key: 'reminderHour',
            type: 'select',
            number: true,
            label: 'Godzina przypomnienia dzień przed',
            options: hours(12, 12).concat(hours(14, 14), hours(16, 22)),
          },
        ],
        extra: 'notifications',
      },
      {
        id: 'pushups',
        title: 'Licznik pompek',
        description: 'Dzienna liczba rośnie o stały przyrost co 7 dni od daty startu.',
        icon: Dumbbell,
        keywords: 'pompki wyzwanie licznik start przyrost tydzień',
        summary: (s) => `${s.pushupsStartCount} +${s.pushupsWeeklyIncrement} tygodniowo`,
        rows: [
          { key: 'pushupsStartDate', type: 'date', label: 'Data startu wyzwania' },
          {
            key: 'pushupsStartCount',
            type: 'number',
            min: 0,
            max: 999,
            label: 'Pompek dziennie na starcie',
          },
          {
            key: 'pushupsWeeklyIncrement',
            type: 'number',
            min: 0,
            max: 100,
            label: 'Przyrost co tydzień',
          },
        ],
      },
    ],
  },
  {
    id: 'account',
    title: 'Konto i dane',
    sections: [
      {
        id: 'profile',
        title: 'Profil',
        description: 'Pseudonim widoczny dla znajomych.',
        icon: User,
        keywords: 'profil pseudonim imię nick nazwa',
        custom: 'profile',
      },
      {
        id: 'password',
        title: 'Hasło',
        description: 'Zmiana hasła do konta.',
        icon: KeyRound,
        keywords: 'hasło zmiana hasła bezpieczeństwo logowanie konto',
        custom: 'password',
      },
      {
        id: 'privacy',
        title: 'Prywatność',
        description: 'Co widzą znajomi z Twoich grup.',
        icon: ShieldCheck,
        keywords: 'prywatność szczegóły zajęć zajęty znajomi widoczność',
        custom: 'privacy',
      },
      {
        id: 'export',
        title: 'Eksport danych',
        description: 'Kopia Twoich danych i polityka prywatności.',
        icon: Download,
        keywords: 'eksport dane json ics kalendarz kopia pobierz polityka prywatności',
        custom: 'export',
      },
      {
        id: 'reset',
        title: 'Przywracanie',
        description: 'Powrót do domyślnych ustawień interfejsu.',
        icon: RotateCcw,
        keywords: 'przywróć domyślne reset ustawienia interfejs',
        custom: 'reset',
      },
      {
        id: 'danger',
        title: 'Usuwanie danych i konta',
        description: 'Operacje nieodwracalne.',
        icon: Trash2,
        keywords: 'usuń usunięcie konto plan dane kasowanie',
        custom: 'danger',
      },
    ],
  },
]