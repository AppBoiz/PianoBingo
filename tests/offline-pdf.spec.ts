import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

test('service worker precaches pdf assets and serves them offline', async ({ page, context }) => {
  // load app (webServer in playwright.config starts server and runs build)
  await page.goto('/')

  // wait for service worker controller to be active
  await page.waitForFunction(() => (navigator as any).serviceWorker && !!(navigator as any).serviceWorker.controller, null, { timeout: 15000 })

  // fetch generated sw-manifest.json to get the exact hashed asset names
  const manifest = await page.evaluate(async () => {
    try {
      const r = await fetch('/sw-manifest.json');
      if (!r.ok) return null;
      return r.json();
    } catch (e) { return null }
  })

  expect(manifest).not.toBeNull()
  const assets: string[] = manifest as string[]
  expect(assets.length).toBeGreaterThan(0)

  // Verify cached entries contain the pdf assets
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

  // At least one pdf-related asset (worker or pdf chunk) must be cached
  const anyCached = Object.values(cached).some(Boolean)
  expect(anyCached).toBeTruthy()

  // Prepare a currentSong entry so PdfReader can render a PDF
  const pdfPath = path.join(process.cwd(), 'resources', 'pdf', 'introdutione-seconda.pdf')
  const base64 = fs.readFileSync(pdfPath).toString('base64')

  expect(base64).toBeTruthy()

  await page.evaluate((pdf) => {
    const gameState = {
      selectedSongPackId: 1,
      shownSongIds: [1],
      currentSong: { songId: 1, title: 'Test Song', pdfUrl: pdf }
    }
    localStorage.setItem('gameState', JSON.stringify(gameState))
    ;(window as any).__PDF_RENDERED__ = false
    ;(window as any).__PDF_RENDER_ERROR__ = null
  }, base64)

  // Verify first-page render while online
  await page.evaluate(() => {
    window.history.pushState({}, '', '/pdf-reader')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.waitForSelector('#pdf-viewer', { state: 'attached', timeout: 30000 })
  await page.waitForFunction(
    () => (window as any).__PDF_RENDERED__ || (window as any).__PDF_RENDER_ERROR__,
    null,
    { timeout: 30000 }
  )
  const renderError = await page.evaluate(() => (window as any).__PDF_RENDER_ERROR__)
  expect(renderError).toBeFalsy()
  await page.waitForSelector('#pdf-viewer canvas', { state: 'attached', timeout: 30000 })
  const initialCanvas = await page.evaluate(() => {
    const canvas = document.querySelector('#pdf-viewer canvas') as HTMLCanvasElement | null
    if (!canvas) return null
    return { width: canvas.width, height: canvas.height }
  })
  expect(initialCanvas).not.toBeNull()
  expect(initialCanvas!.width).toBeGreaterThan(0)
  expect(initialCanvas!.height).toBeGreaterThan(0)

  // Now go offline and attempt to fetch one of the assets via fetch (should succeed from SW cache)
  await context.setOffline(true)
  const assetToFetch = assets[0]
  const status = await page.evaluate(async (asset) => {
    try {
      const r = await fetch(asset)
      return r.status
    } catch (e) { return -1 }
  }, assetToFetch)

  expect(status).toBe(200)

  // Reload PdfReader offline and confirm render still works from cache
  await page.evaluate(() => {
    ;(window as any).__PDF_RENDERED__ = false
    ;(window as any).__PDF_RENDER_ERROR__ = null
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.history.pushState({}, '', '/pdf-reader')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.waitForSelector('#pdf-viewer', { state: 'attached', timeout: 30000 })
  await page.waitForFunction(
    () => (window as any).__PDF_RENDERED__ || (window as any).__PDF_RENDER_ERROR__,
    null,
    { timeout: 30000 }
  )
  const offlineRenderError = await page.evaluate(() => (window as any).__PDF_RENDER_ERROR__)
  expect(offlineRenderError).toBeFalsy()
  await page.waitForSelector('#pdf-viewer canvas', { state: 'attached', timeout: 30000 })
  const offlineCanvas = await page.evaluate(() => {
    const canvas = document.querySelector('#pdf-viewer canvas') as HTMLCanvasElement | null
    if (!canvas) return null
    return { width: canvas.width, height: canvas.height }
  })
  expect(offlineCanvas).not.toBeNull()
  expect(offlineCanvas!.width).toBeGreaterThan(0)
  expect(offlineCanvas!.height).toBeGreaterThan(0)
})
