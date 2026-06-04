const fs = require('fs')
const path = require('path')

const distAssetsDir = path.join(__dirname, '..', 'dist', 'assets')
const outManifest = path.join(__dirname, '..', 'dist', 'sw-manifest.json')

function main(){
  if (!fs.existsSync(distAssetsDir)){
    console.error('dist/assets not found — run `npm run build` first')
    process.exit(1)
  }

  const files = fs.readdirSync(distAssetsDir)
  const pdfFiles = files.filter(f => /pdf.*\.js$/.test(f))
  const urls = pdfFiles.map(f => '/assets/' + f)

  fs.writeFileSync(outManifest, JSON.stringify(urls, null, 2), 'utf8')
  console.log('Wrote', outManifest, urls.length, 'entries')
}

main()
