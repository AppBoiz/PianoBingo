// Initialize preloaded data FIRST - must happen before IndexedDB initialization
import { initializePreloadedData } from './init/preloadData'

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { loadGameState } from './shared/storage/indexedDb'

import './styles/tailwind.css'
import '/styles.css'
// Legacy styles applied globally to help achieve visual parity
import './styles/legacy/welcome-page.css'
import './styles/legacy/pack-select.css'
import './styles/legacy/pack-management.css'
import './styles/legacy/pack-edit.css'
import './styles/legacy/song-management.css'
import './styles/legacy/pdf-reader.css'
import './styles/legacy/game-history.css'
import './styles/legacy/song-view.css'

// Initialize and then render
async function bootstrap() {
  // Wait for preloaded data to load
  await initializePreloadedData()
  
  // Trigger localStorage migration early if needed
  loadGameState()

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
}

bootstrap().catch(err => console.error('Bootstrap failed:', err))
// Register Workbox-generated service worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err))
  })
}