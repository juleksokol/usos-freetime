import { createContext, useContext } from 'react'

// t: tłumaczenie klucza, lang: 'pl' | 'en', choice: wybór użytkownika ('auto' | 'pl' | 'en'),
// locale: kod do formatowania dat i liczb (np. 'pl-PL'), setLang: zmiana języka
export const I18nContext = createContext({
  t: (key) => key,
  lang: 'pl',
  choice: 'pl',
  locale: 'pl-PL',
  setLang: () => {},
})

export function useI18n() {
  return useContext(I18nContext)
}