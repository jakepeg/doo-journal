export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Registering service worker...')
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('Service worker registered:', registration.scope)
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Dispatch custom event for update notification
              window.dispatchEvent(new CustomEvent('sw-update-available', {
                detail: { registration }
              }))
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error('Service worker registration failed:', error)
      return null
    }
  } else {
    console.log('Service workers not supported')
    return null
  }
}

export const unregisterSW = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      return registration.unregister()
    }
  }
  return false
}