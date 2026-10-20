import { useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import { useSettings } from '../context/SettingsContext'
import { nextTrapIndex } from '../lib/focusTrap'
import '../a11y.css'

const DIALOG_SELECTOR = '[role="dialog"][aria-modal="true"]'
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

// Widoczne elementy, do których można przejść klawiaturą
function focusableIn(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((element) => {
    if (element.getAttribute('aria-hidden') === 'true') return false
    return (
      window.getComputedStyle(element).visibility !== 'hidden' &&
      element.getClientRects().length > 0
    )
  })
}

/**
 * Obsługa fokusu we wszystkich oknach dialogowych (role="dialog" aria-modal="true"):
 * po otwarciu fokus trafia do okna, Tab krąży wewnątrz okna, przewijanie tła jest zablokowane,
 * a po zamknięciu fokus wraca na element, który otworzył okno.
 */
function useDialogFocus() {
  useEffect(() => {
    const open = [] // { el, opener }, ostatnie okno jest na wierzchu
    const history = [] // ostatnio zaznaczane elementy
    let savedOverflow = null

    const handleFocusIn = (event) => {
      history.push(event.target)
      if (history.length > 30) history.shift()
    }

    const sync = () => {
      const present = Array.from(document.querySelectorAll(DIALOG_SELECTOR))

      // Nowe okna
      for (const el of present) {
        if (open.some((item) => item.el === el)) continue

        const opener =
          [...history].reverse().find((node) => node.isConnected && !el.contains(node)) ?? null
        open.push({ el, opener })

        if (!el.contains(document.activeElement)) {
          const target = el.querySelector('[data-autofocus]') ?? focusableIn(el)[0]
          if (target) {
            target.focus({ preventScroll: true })
          } else {
            el.setAttribute('tabindex', '-1')
            el.focus({ preventScroll: true })
          }
        }
      }

      // Zamknięte okna: fokus wraca na element, który je otworzył
      for (let i = open.length - 1; i >= 0; i--) {
        if (present.includes(open[i].el)) continue

        const [{ opener }] = open.splice(i, 1)
        if (opener?.isConnected) opener.focus({ preventScroll: true })
      }

      // Blokada przewijania tła
      if (open.length > 0 && savedOverflow === null) {
        savedOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
      } else if (open.length === 0 && savedOverflow !== null) {
        document.body.style.overflow = savedOverflow
        savedOverflow = null
      }
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab' || open.length === 0) return

      const items = focusableIn(open[open.length - 1].el)
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const next = nextTrapIndex({
        count: items.length,
        index: items.indexOf(document.activeElement),
        shift: event.shiftKey,
      })

      if (next !== null) {
        event.preventDefault()
        items[next].focus()
      }
    }

    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('keydown', handleKeyDown)
    sync()

    return () => {
      observer.disconnect()
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('keydown', handleKeyDown)
      if (savedOverflow !== null) document.body.style.overflow = savedOverflow
    }
  }, [])
}

/**
 * Warstwa dostępności całej aplikacji: link „Przejdź do treści”, region komunikatów dla
 * czytników ekranu, obsługa fokusu w oknach, język strony i ustawienia dostępności.
 */
export default function A11yLayer() {
   const { settings } = useSettings()
  const { t } = useI18n()

  useDialogFocus()

  // Ustawienia dostępności jako klasy na elemencie <html> (style w a11y.css)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('hc', Boolean(settings.highContrast))
    root.classList.toggle('large-targets', Boolean(settings.largeTargets))
    root.classList.toggle('text-spacing', Boolean(settings.textSpacing))
  }, [settings.highContrast, settings.largeTargets, settings.textSpacing])

 

  const skipToContent = (event) => {
    event.preventDefault()

    const target = document.getElementById('main-content') ?? document.querySelector('main')
    if (!target) return

    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus()
    target.scrollIntoView?.({ block: 'start' })
  }

  return (
    <>
      <a href="#main-content" onClick={skipToContent} className="skip-link">
                {t('app.skipToContent')}
      </a>
      <div
        id="a11y-announcer"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </>
  )
}