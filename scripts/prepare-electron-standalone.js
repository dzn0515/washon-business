const fs = require('fs')
const path = require('path')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Missing directory: ${src}`)
    process.exit(1)
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

const root = path.join(__dirname, '..')
const standaloneDir = path.join(root, '.next', 'standalone')

copyDir(path.join(root, '.next', 'static'), path.join(standaloneDir, '.next', 'static'))

const publicDir = path.join(root, 'public')
if (fs.existsSync(publicDir)) {
  copyDir(publicDir, path.join(standaloneDir, 'public'))
}

console.log('Electron standalone bundle prepared.')
