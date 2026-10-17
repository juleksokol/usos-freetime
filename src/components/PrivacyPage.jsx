import { ArrowLeft } from 'lucide-react'

// Szablon: uzupełnij pola w nawiasach kwadratowych przed udostępnieniem aplikacji innym osobom.
export default function PrivacyPage() {
  const h2 = 'mt-8 text-lg font-semibold text-slate-800'
  const p = 'mt-2 text-sm leading-relaxed text-slate-600'
  const li = 'mt-1'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href="#/"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do aplikacji
      </a>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">
        Polityka prywatności
      </h1>
      <p className="mt-1 text-xs text-slate-400">
        Ostatnia aktualizacja: [data]
      </p>

      <h2 className={h2}>Kto odpowiada za dane</h2>
      <p className={p}>
        USOS FreeTime to prywatny projekt prowadzony przez [imię i nazwisko lub
        pseudonim]. Kontakt w sprawach danych: [adres e-mail].
      </p>

      <h2 className={h2}>Jakie dane przetwarzamy</h2>
      <ul className={`${p} list-disc pl-5`}>
        <li className={li}>adres e-mail i hasło (hasło jest przechowywane w postaci zaszyfrowanej przez usługę logowania),</li>
        <li className={li}>pseudonim wyświetlany znajomym,</li>
        <li className={li}>plan zajęć: nazwy przedmiotów, daty, godziny, sale i prowadzący,</li>
        <li className={li}>własne wydarzenia oraz sprawdziany wraz z notatkami i wynikami,</li>
        <li className={li}>członkostwo w grupach, ustawienia interfejsu i prywatności oraz Twoje decyzje, które zajęcia lub przedmioty pokazywać znajomym tylko jako „zajęty” albo ukryć,</li>
        <li className={li}>adresy i nazwy własnych szybkich linków (zapisane w ustawieniach konta),</li>
        <li className={li}>dane techniczne o błędach aplikacji (bez danych osobowych), jeśli włączono monitorowanie błędów.</li>
      </ul>

      <h2 className={h2}>Po co</h2>
      <p className={p}>
        Wyłącznie po to, aby aplikacja działała: nakładała plany znajomych,
        wyznaczała wspólne okienka i przypominała o sprawdzianach. Nie sprzedajemy
        danych i nie wyświetlamy reklam.
      </p>

      <h2 className={h2}>Kto widzi Twoje dane</h2>
      <ul className={`${p} list-disc pl-5`}>
        <li className={li}>Ty widzisz wszystko, co zapisałeś.</li>
        <li className={li}>
          Osoby z Twoich grup widzą Twój plan: ze szczegółami albo tylko jako
          „zajęty”, zależnie od ustawienia „Prywatność” w aplikacji. Pojedyncze
          zajęcia lub cały przedmiot możesz pokazać znajomym tylko jako „zajęty”
          albo ukryć. Ukryte zajęcia nie są wtedy widoczne dla znajomych, więc
          dla nich jesteś w tym czasie wolny lub wolna.
        </li>
        <li className={li}>Sprawdziany, notatki, wyniki i ustawienia widzisz tylko Ty.</li>
      </ul>

      <h2 className={h2}>Podmioty, którym powierzamy dane</h2>
      <ul className={`${p} list-disc pl-5`}>
        <li className={li}>Supabase: baza danych i logowanie (region: [region bazy, np. Frankfurt]),</li>
        <li className={li}>Vercel: hosting aplikacji,</li>
        <li className={li}>Sentry: raporty o błędach (opcjonalnie, bez danych osobowych),</li>
        <li className={li}>
          Google (opcjonalnie): jeśli dla szybkiego linku wybierzesz ikonę strony,
          Twoja przeglądarka pobierze ją z usługi Google, która dowie się nazwy
          domeny tego linku (bez Twoich danych z aplikacji).
        </li>
      </ul>

      <h2 className={h2}>Dane zapisane w Twojej przeglądarce</h2>
      <p className={p}>
        Aplikacja zapisuje na urządzeniu ustawienia, ostatnio wybraną zakładkę i
        grupę, pamięć podręczną Twojego planu (czyszczoną przy wylogowaniu) oraz
        pliki aplikacji potrzebne do pracy jako PWA.
      </p>

      <h2 className={h2}>Twoje prawa</h2>
      <ul className={`${p} list-disc pl-5`}>
        <li className={li}>wgląd i kopia danych: Ustawienia → Eksport danych (JSON i kalendarz),</li>
        <li className={li}>poprawianie danych: edycja pseudonimu, planu i sprawdzianów w aplikacji,</li>
        <li className={li}>usunięcie danych i konta: Ustawienia → Dane i konto (usunięcie jest trwałe),</li>
        <li className={li}>skarga do organu nadzorczego (Prezes Urzędu Ochrony Danych Osobowych).</li>
      </ul>

      <h2 className={h2}>Zmiany polityki</h2>
      <p className={p}>
        O istotnych zmianach poinformujemy w aplikacji. Aktualna wersja jest
        zawsze pod tym adresem.
      </p>
    </div>
  )
}