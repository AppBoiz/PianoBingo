import { test, expect } from '@playwright/test'

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
})
