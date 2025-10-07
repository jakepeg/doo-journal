export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Registering service worker v3...')
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })
      
      console.log('Service worker registered:', registration.scope)
      
      // Force immediate update check
      registration.update()
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          console.log('New service worker found, installing...')
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Update available - show notification
                console.log('Service worker update available')
                window.dispatchEvent(new CustomEvent('sw-update-available', {
                  detail: { registration }
                }))
              } else {
                // First install
                console.log('Service worker installed for the first time')
                window.dispatchEvent(new CustomEvent('sw-ready'))
              }
            }
          })
        }
      })

      // Handle controller change (new SW took over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed - reloading page')
        window.location.reload()
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