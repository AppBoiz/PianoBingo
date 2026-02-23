const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

;(async () => {
  const BASE = 'http://localhost:5173'
  const pages = [
    { path: '/legacy-pages/welcome-page/welcome-page.html', name: 'legacy-welcome' },
    { path: '/legacy-pages/pack-select/pack-select.html', name: 'legacy-pack-select' },
    { path: '/legacy-pages/song-management/song-management.html', name: 'legacy-song-management' },
    { path: '/legacy-pages/pdf-reader/pdf-reader.html', name: 'legacy-pdf-reader' },
  ]
  const outDir = path.resolve(__dirname, '..', 'test-results', 'screenshots')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage()
  for (const p of pages) {
    const url = BASE + p.path
    console.log('Capturing', url)
    await page.goto(url, { waitUntil: 'networkidle' })
    const out = path.join(outDir, `${p.name}.png`)
    await page.screenshot({ path: out, fullPage: true })
    console.log('Saved', out)
  }
  await browser.close()
})()
