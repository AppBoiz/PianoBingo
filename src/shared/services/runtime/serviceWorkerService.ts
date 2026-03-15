const DEFAULT_SERVICE_WORKER_PATH = '/service-worker.js'

export async function registerServiceWorker(path = DEFAULT_SERVICE_WORKER_PATH): Promise<void> {
  const registration = await navigator.serviceWorker.register(path)
  console.log('SW registered:', registration.scope)
}

export function registerProductionServiceWorker(path = DEFAULT_SERVICE_WORKER_PATH): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return
  }

  window.addEventListener('load', () => {
    registerServiceWorker(path).catch(error => {
      console.warn('SW registration failed:', error)
    })
  }, { once: true })
}