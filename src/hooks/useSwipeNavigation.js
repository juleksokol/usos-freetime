import { useEffect } from 'react'

const MIN_DISTANCE = 70

// Najbliższy przewijany poziomo element (np. szeroka siatka planu)
function horizontalScroller(target, root) {
  let node = target

  while (node && node !== root && node.nodeType === 1) {
    if (node.scrollWidth > node.clientWidth + 1) {
      const overflowX = getComputedStyle(node).overflowX
      if (overflowX === 'auto' || overflowX === 'scroll') return node
    }
    node = node.parentElement
  }

  return null
}

/**
 * Przesunięcie palcem w bok zmienia tydzień lub dzień: klika istniejące strzałki
 * "Poprzedni/Następny tydzień" albo "Poprzedni/Następny dzień" w danym widoku.
 * Gdy siatka da się przewijać, tydzień zmienia dopiero gest wykonany na jej skraju.
 */
export default function useSwipeNavigation(ref, enabled = true) {
  useEffect(() => {
    const root = ref.current
    if (!root || !enabled) return

    let start = null

    const handleStart = (e) => {
      if (e.touches.length !== 1 || e.target.closest('input, textarea, select')) {
        start = null
        return
      }

      const touch = e.touches[0]
      const scroller = horizontalScroller(e.target, root)

      start = {
        x: touch.clientX,
        y: touch.clientY,
        atLeft: !scroller || scroller.scrollLeft <= 1,
        atRight:
          !scroller ||
          scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1,
      }
    }

    const handleEnd = (e) => {
      const gesture = start
      start = null

      // Trwające przeciąganie po siatce (tworzenie wydarzenia) nie zmienia tygodnia
      if (!gesture || document.body.dataset.dragging) return

      const touch = e.changedTouches[0]
      const dx = touch.clientX - gesture.x
      const dy = touch.clientY - gesture.y

      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.8) return

      const previous = dx > 0
      if (previous && !gesture.atLeft) return
      if (!previous && !gesture.atRight) return

      const selector = previous
        ? '[aria-label="Poprzedni tydzień"], [aria-label="Poprzedni dzień"]'
        : '[aria-label="Następny tydzień"], [aria-label="Następny dzień"]'

      root.querySelector(selector)?.click()
    }

    root.addEventListener('touchstart', handleStart, { passive: true })
    root.addEventListener('touchend', handleEnd, { passive: true })

    return () => {
      root.removeEventListener('touchstart', handleStart)
      root.removeEventListener('touchend', handleEnd)
    }
  }, [ref, enabled])
}