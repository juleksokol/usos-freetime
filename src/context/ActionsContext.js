import { createContext, useContext } from 'react'

// Akcje udostępniane w całej aplikacji: widoczność zajęć dla znajomych i kreator
export const ActionsContext = createContext({
  rules: {},
  setEventVisibility: null,
  setSubjectVisibility: null,
  openWizard: null,
})

export function useActions() {
  return useContext(ActionsContext)
}