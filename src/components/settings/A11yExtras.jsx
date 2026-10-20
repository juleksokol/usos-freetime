function Kbd({ children }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-700">
      {children}
    </kbd>
  )
}

// Dodatek do sekcji „Dostępność”: obsługa bez myszy i link do deklaracji dostępności
export default function A11yExtras() {
  return (
    <div className="py-4">
      <p className="text-sm font-medium text-slate-800">Obsługa bez myszy</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
        <li>
          <Kbd>Tab</Kbd> i <Kbd>Shift</Kbd>+<Kbd>Tab</Kbd>: przechodzenie między elementami.
        </li>
        <li>
          <Kbd>Enter</Kbd> lub <Kbd>Spacja</Kbd>: wybór przycisku.
        </li>
        <li>
          <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>: wyszukiwarka.
        </li>
        <li>
          <Kbd>Esc</Kbd>: zamknięcie okna albo trybu edycji układu.
        </li>
        <li>
          Tryb edycji układu: <Kbd>Spacja</Kbd> podnosi blok, strzałki go przesuwają, a{' '}
          <Kbd>Spacja</Kbd> go upuszcza.
        </li>
      </ul>
      <p className="mt-3 text-sm text-slate-600">
        Animacje wyłączysz w sekcji „Motyw i kolory”. Aplikacja szanuje też systemowe ustawienie
        „ogranicz ruch”.
      </p>
      <a
        href="#/dostepnosc"
        className="mt-3 inline-block text-sm text-indigo-700 underline-offset-2 hover:underline"
      >
        Deklaracja dostępności
      </a>
    </div>
  )
}