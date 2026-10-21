import { ArrowLeft } from 'lucide-react'

// Szablon: uzupełnij pola w nawiasach kwadratowych. To samoocena autora, a nie audyt zewnętrzny.
export default function AccessibilityPage() {
  const h2 = 'mt-8 text-lg font-semibold text-slate-800'
  const p = 'mt-2 text-sm leading-relaxed text-slate-700'
  const li = 'mt-1'

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <a
        href="#/"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Wróć do aplikacji
      </a>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">Deklaracja dostępności</h1>
      <p className="mt-1 text-xs text-slate-600">Ostatnia aktualizacja: [data]</p>

      <h2 className={h2}>Stan zgodności</h2>
      <p className={p}>
        Aplikacja USOS FreeTime jest częściowo zgodna ze standardem WCAG 2.2 na poziomie AA.
        Dostępność poprawiamy na bieżąco. Ocena jest samooceną autora, wykonaną na podstawie
        przeglądu kodu i automatycznych testów kontrastu kolorów, a nie audytem zewnętrznym.
      </p>

      <h2 className={h2}>Co działa</h2>
      <ul className={`${p} list-disc pl-5`}>
        <li className={li}>
          Obsługa samą klawiaturą (Tab, Enter, Spacja, Esc, Ctrl+K) oraz link „Przejdź do treści”.
        </li>
        <li className={li}>
          Okna dialogowe przejmują fokus, nie wypuszczają go na tło i oddają go po zamknięciu.
        </li>
        <li className={li}>
          Pola formularzy mają etykiety, a błędy i potwierdzenia są odczytywane przez czytniki
          ekranu. Spełnienie wymagań hasła jest podane tekstem, a nie tylko kolorem.
        </li>
        <li className={li}>
          Kontrast kolorów tekstu (4,5:1) i obramowań pól (3:1) jest pilnowany testem
          automatycznym, także w ciemnym motywie i dla każdego koloru akcentu.
        </li>
        <li className={li}>
          Ustawienia: wysoki kontrast, większe elementy do klikania, większe odstępy w tekście,
          trzy rozmiary tekstu, wyłączenie animacji (także systemowe „ogranicz ruch”) oraz
          paleta kolorów dla osób z zaburzeniami widzenia barw.
        </li>
        <li className={li}>
          Kafelki zajęć są przyciskami z pełnym opisem (przedmiot, dzień, godziny, miejsce,
          prowadzący) dla czytników ekranu.
        </li>
      </ul>

      <h2 className={h2}>Znane ograniczenia</h2>
      <ul className={`${p} list-disc pl-5`}>
        <li className={li}>
          Siatka planu tygodnia jest złożonym widokiem graficznym. Poruszanie się po całym
          tygodniu klawiaturą jest długie. Planujemy dodać widok tekstowy (listę zajęć).
        </li>
        <li className={li}>
          Tworzenie wydarzenia przez przeciągnięcie po siatce nie ma odpowiednika klawiaturowego
          w samej siatce. Użyj formularza w bloku „Własne wydarzenia”.
        </li>
        <li className={li}>
          Aplikacja jest dostępna tylko w języku polskim (wersja angielska jest planowana).
        </li>
        <li className={li}>
          Testy z czytnikami ekranu: Brak.
        </li>
      </ul>

      <h2 className={h2}>Zgłaszanie problemów</h2>
      <p className={p}>
        Jeśli napotkasz barierę, napisz na adres usos.freetime@gmail.com. Opisz, co nie działa, na jakim
        urządzeniu i w jakiej przeglądarce. Postaramy się odpowiedzieć w ciągu 14 dni
        roboczych i zaproponować dostępną alternatywę.
      </p>
    </main>
  )
}