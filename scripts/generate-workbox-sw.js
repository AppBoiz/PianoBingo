const { generateSW } = require('workbox-build')
const path = require('path')

async function buildSW(){
  const swDest = path.join(__dirname, '..', 'dist', 'service-worker.js')
  try {
    const { count, size, warnings } = await generateSW({
      swDest,
      globDirectory: path.join(__dirname, '..', 'dist'),
      globPatterns: [
        'assets/**.*',
        '*.html',
        'manifest.json'
      ],
      runtimeCaching: [
        {
          urlPattern: /\/assets\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'assets-cache',
            expiration: { maxEntries: 200 }
          }
        },
        {
          urlPattern: /\/.*/,
          handler: 'NetworkFirst',
          options: { cacheName: 'pages-cache' }
        }
      ],
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true  // Clean up old cache names like 'pianobingo-cache-v1'
    })
    if (warnings && warnings.length) console.warn('Workbox warnings:', warnings)
    console.log(`Generated SW and precached ${count} files, total ${size} bytes into ${swDest}`)
  } catch (err) {
    console.error('Failed to generate SW:', err)
    process.exit(1)
  }
}

buildSW()
