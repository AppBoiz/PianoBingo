const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')
const _pm = require('pixelmatch')
const pixelmatch = _pm && (_pm.default || _pm)

const screenshotsDir = path.resolve(__dirname, '..', 'test-results', 'screenshots')
const diffsDir = path.resolve(__dirname, '..', 'test-results', 'diffs')
if (!fs.existsSync(diffsDir)) fs.mkdirSync(diffsDir, { recursive: true })

const pairs = [
  { a: 'home.png', b: 'legacy-welcome.png', name: 'home' },
  { a: 'pack-select.png', b: 'legacy-pack-select.png', name: 'pack-select' },
  { a: 'song-management.png', b: 'legacy-song-management.png', name: 'song-management' },
  { a: 'pdf-reader.png', b: 'legacy-pdf-reader.png', name: 'pdf-reader' },
]

function readPNG(filePath) {
  if (!fs.existsSync(filePath)) return null
  const buf = fs.readFileSync(filePath)
  return PNG.sync.read(buf)
}

function ensureSameSize(imgA, imgB) {
  const width = Math.max(imgA.width, imgB.width)
  const height = Math.max(imgA.height, imgB.height)
  if (imgA.width === width && imgA.height === height && imgB.width === width && imgB.height === height) {
    return { imgA, imgB, width, height }
  }
  const A = new PNG({ width, height, fill: true })
  const B = new PNG({ width, height, fill: true })
  // fill with white background
  A.data.fill(255)
  B.data.fill(255)

  // copy original pixels
  function blit(src, dst) {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const idxSrc = (src.width * y + x) << 2
        const idxDst = (width * y + x) << 2
        dst.data[idxDst] = src.data[idxSrc]
        dst.data[idxDst + 1] = src.data[idxSrc + 1]
        dst.data[idxDst + 2] = src.data[idxSrc + 2]
        dst.data[idxDst + 3] = src.data[idxSrc + 3]
      }
    }
  }
  blit(imgA, A)
  blit(imgB, B)
  return { imgA: A, imgB: B, width, height }
}

const results = []
for (const pair of pairs) {
  const aPath = path.join(screenshotsDir, pair.a)
  const bPath = path.join(screenshotsDir, pair.b)
  const outPath = path.join(diffsDir, `${pair.name}-diff.png`)

  const imgA = readPNG(aPath)
  const imgB = readPNG(bPath)

  if (!imgA || !imgB) {
    console.warn(`Skipping ${pair.name}: missing image(s)`, !imgA && aPath, !imgB && bPath)
    results.push({ name: pair.name, error: 'missing image' })
    continue
  }

  const { imgA: A, imgB: B, width, height } = ensureSameSize(imgA, imgB)
  const diff = new PNG({ width, height })
  const numDiff = pixelmatch(A.data, B.data, diff.data, width, height, { threshold: 0.12 })
  fs.writeFileSync(outPath, PNG.sync.write(diff))
  const total = width * height
  results.push({ name: pair.name, width, height, numDiff, total, diffPath: path.relative(process.cwd(), outPath) })
  console.log(`${pair.name}: ${numDiff} pixels different (${((numDiff/total)*100).toFixed(4)}%) -> ${outPath}`)
}

// Write a markdown report
const reportLines = [
  '# Pixelmatch Visual Diff Results',
  `Date: ${new Date().toISOString()}`,
  '',
]
for (const r of results) {
  if (r.error) {
    reportLines.push(`- **${r.name}**: ERROR - ${r.error}`)
  } else {
    reportLines.push(`- **${r.name}**: ${r.numDiff} / ${r.total} pixels different (${((r.numDiff/r.total)*100).toFixed(6)}%)`) 
    reportLines.push(`  - diff image: ${r.diffPath}`)
  }
}
fs.writeFileSync(path.resolve(__dirname, '..', 'docs', 'visual-diff-results.md'), reportLines.join('\n'))
console.log('Wrote docs/visual-diff-results.md')
