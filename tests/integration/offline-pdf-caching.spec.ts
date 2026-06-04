import { test, expect } from '@playwright/test'

test.describe('Service Worker Offline PDF Caching', () => {
  /**
   * Waits for the service worker controller to be active on the current page.
   * The SW is registered and activated on first app load.
   */
  async function waitForServiceWorker(page: any) {
    await page.waitForFunction(
      () => !!(navigator as any).serviceWorker?.controller,
      null,
      { timeout: 15000 }
    )
  }

  /**
   * Fetches the sw-manifest.json and returns the list of precached asset paths.
   */
  async function getManifestAssets(page: any): Promise<string[]> {
    const manifest = await page.evaluate(async () => {
      try {
        const r = await fetch('/sw-manifest.json')
        if (!r.ok) return null
        return r.json()
      } catch { return null }
    })
    expect(manifest).not.toBeNull()
    return manifest as string[]
  }

  test('service worker activates and caches pdf manifest assets', async ({ page }) => {
    await page.goto('/')
    await waitForServiceWorker(page)

    const assets = await getManifestAssets(page)
    expect(assets.length).toBeGreaterThan(0)

    // At least one pdf-related asset must be present in the SW cache
    const cached = await page.evaluate(async (assetPaths: string[]) => {
      const keys = await caches.keys()
      const found: Record<string, boolean> = {}
      for (const a of assetPaths) found[a] = false
      for (const k of keys) {
        const c = await caches.open(k)
        const reqs = await c.keys()
        const urls = reqs.map(r => new URL(r.url).pathname)
        for (const a of assetPaths) {
          const p = a.startsWith('/') ? a : '/' + a
          if (urls.includes(p)) found[a] = true
        }
      }
      return found
    }, assets)

    const anyCached = Object.values(cached).some(Boolean)
    expect(anyCached).toBeTruthy()
  })

  test('cached assets are served while offline', async ({ page, context }) => {
    await page.goto('/')
    await waitForServiceWorker(page)

    const assets = await getManifestAssets(page)
    expect(assets.length).toBeGreaterThan(0)

    await context.setOffline(true)

    // Any asset from the manifest should be returned by the SW cache with status 200
    const status = await page.evaluate(async (asset: string) => {
      try {
        const r = await fetch(asset)
        return r.status
      } catch { return -1 }
    }, assets[0])

    expect(status).toBe(200)
  })

  test('pdf viewer renders correctly in offline mode', async ({ page, context }) => {
    await page.goto('/')
    await waitForServiceWorker(page)

    // Set up game state pointing at song 1. getCurrentSong() reads currentSong.songId
    // from localStorage and loads the song record from IndexedDB — the IDB record
    // is seeded by the app on first openDB() call with the base song data including
    // the correct pdfUrl lookup key, which resolves via the populated pdfMap.
    await page.evaluate(() => {
      const gameState = {
        selectedSongPackId: 1,
        shownSongIds: [1],
        currentSong: { songId: 1, title: 'Colours in her Hair' }
      }
      localStorage.setItem('gameState', JSON.stringify(gameState))
      ;(window as any).__PDF_RENDERED__ = false
      ;(window as any).__PDF_RENDER_ERROR__ = null
    })

    // Navigate to the game page (which contains PDFViewer) while still online to verify baseline render.
    // /pdf-reader is not a React Router route; /game is the equivalent viewer in the current app.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForSelector('#pdf-viewer', { state: 'attached', timeout: 30000 })
    await page.waitForFunction(
      () => (window as any).__PDF_RENDERED__ || (window as any).__PDF_RENDER_ERROR__,
      null,
      { timeout: 30000 }
    )
    const onlineError = await page.evaluate(() => (window as any).__PDF_RENDER_ERROR__)
    expect(onlineError).toBeFalsy()

    // Switch offline and reload — SW should serve all assets from cache
    await context.setOffline(true)
    await page.evaluate(() => {
      ;(window as any).__PDF_RENDERED__ = false
      ;(window as any).__PDF_RENDER_ERROR__ = null
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      window.history.pushState({}, '', '/game')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await page.waitForSelector('#pdf-viewer', { state: 'attached', timeout: 30000 })
    await page.waitForFunction(
      () => (window as any).__PDF_RENDERED__ || (window as any).__PDF_RENDER_ERROR__,
      null,
      { timeout: 30000 }
    )

    const offlineError = await page.evaluate(() => (window as any).__PDF_RENDER_ERROR__)
    expect(offlineError).toBeFalsy()

    const offlineCanvas = await page.evaluate(() => {
      const canvas = document.querySelector('#pdf-viewer canvas') as HTMLCanvasElement | null
      return canvas ? { width: canvas.width, height: canvas.height } : null
    })
    expect(offlineCanvas).not.toBeNull()
    expect(offlineCanvas!.width).toBeGreaterThan(0)
    expect(offlineCanvas!.height).toBeGreaterThan(0)
  })
})
