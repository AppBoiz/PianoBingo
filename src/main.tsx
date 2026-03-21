// Initialize preloaded data FIRST - must happen before IndexedDB initialization
import { initializePreloadedData } from './init/preloadData'

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { loadGameState } from './shared/storage/indexedDb'
import { getRequiredElementById } from './shared/services/runtime/domService'
import { registerProductionServiceWorker } from './shared/services/runtime/serviceWorkerService'

// Initialize and then render
async function bootstrap() {
  // Wait for preloaded data to load
  await initializePreloadedData()
  
  // Trigger localStorage migration early if needed
  loadGameState()

  createRoot(getRequiredElementById<HTMLDivElement>('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
}

bootstrap().catch(err => console.error('Bootstrap failed:', err))
registerProductionServiceWorker()