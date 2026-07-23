const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const source = path.join(projectRoot, 'resources')
const destination = path.join(projectRoot, 'dist', 'resources')

fs.cpSync(source, destination, { recursive: true })
console.log(`Copied resources to ${destination}`)

const iconsSource = path.join(projectRoot, 'icons')
const iconsDestination = path.join(projectRoot, 'dist', 'icons')

fs.cpSync(iconsSource, iconsDestination, { recursive: true })
console.log(`Copied icons to ${iconsDestination}`)
