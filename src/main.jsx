import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import A11yLayer from './components/A11yLayer.jsx'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import I18nProvider from './context/I18nProvider.jsx'
import SettingsProvider from './context/SettingsProvider.jsx'
import { initMonitoring } from './lib/monitoring'

initMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <I18nProvider>
            <A11yLayer />
            <App />
            <UpdatePrompt />
          </I18nProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)