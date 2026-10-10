// 'granted' | 'denied' | 'default' | 'unsupported'
export function notificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (notificationPermission() === 'unsupported') return 'unsupported'

  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

// Pokazuje powiadomienie przez service worker (działa też na Androidzie),
// a gdy go nie ma (np. tryb deweloperski), zwykłym powiadomieniem przeglądarki.
export async function showLocalNotification(title, options = {}) {
  if (notificationPermission() !== 'granted') return false

  const config = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    ...options,
  }

  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) {
      await registration.showNotification(title, config)
      return true
    }
  } catch {
    // przechodzimy do zwykłego powiadomienia
  }

  try {
    new Notification(title, config)
    return true
  } catch {
    return false
  }
}