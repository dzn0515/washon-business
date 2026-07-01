const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const outDir = path.join(__dirname, '..', 'resources')
const outFile = path.join(outDir, 'icon.ico')

fs.mkdirSync(outDir, { recursive: true })

if (process.platform === 'win32') {
  const ps = `
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
$g.FillEllipse([System.Drawing.Brushes]::White, 64, 64, 128, 128)
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream('${outFile.replace(/\\/g, '\\\\')}', [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$g.Dispose()
$bmp.Dispose()
`
  execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { stdio: 'inherit' })
} else {
  console.warn('Placeholder icon: run on Windows or replace resources/icon.ico manually (256x256).')
  if (!fs.existsSync(outFile)) {
    fs.writeFileSync(outFile, Buffer.alloc(0))
  }
}

console.log('Placeholder icon.ico created at resources/icon.ico')
console.log('TODO: 실제 AUTOON 아이콘(256x256 이상)으로 교체')
