// Komunikaty dla czytników ekranu (region aria-live jest w komponencie A11yLayer)
let timer = null

export function announce(message) {
  const region = document.getElementById('a11y-announcer')
  if (!region) return

  region.textContent = ''
  clearTimeout(timer)

  // Krótka przerwa sprawia, że ten sam komunikat zostanie odczytany ponownie
  timer = setTimeout(() => {
    region.textContent = message
  }, 60)
}