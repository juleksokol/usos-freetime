import * as Sentry from '@sentry/react'

let enabled = false

// Włącza Sentry tylko na produkcji i tylko gdy ustawiono VITE_SENTRY_DSN
export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || !import.meta.env.PROD) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  })
  enabled = true
}

export function reportError(error, extra) {
  if (!enabled) return

  try {
    Sentry.captureException(error, { extra })
  } catch {
    // raportowanie błędów nie może samo psuć aplikacji
  }
}