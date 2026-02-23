import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

import './styles/tailwind.css'
import '/styles.css'
// Legacy styles applied globally to help achieve visual parity
import './styles/legacy/welcome-page.css'
import './styles/legacy/pack-select.css'
import './styles/legacy/pack-management.css'
import './styles/legacy/pack-edit.css'
import './styles/legacy/song-management.css'
import './styles/legacy/pdf-reader.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// Register Workbox-generated service worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err))
  })
}
