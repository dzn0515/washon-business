export async function downloadQR(slug: string, svgElement: SVGElement): Promise<void> {
  try {
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        canvas.width = 512
        canvas.height = 512
        ctx.drawImage(img, 0, 0, 512, 512)
        URL.revokeObjectURL(url)
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = `AUTOON_QR_${slug}.png`
        a.click()
        resolve()
      }
      img.onerror = reject
      img.src = url
    })
  } catch {
    console.warn('[QR] PNG 변환 실패 → SVG 다운로드로 대체')
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AUTOON_QR_${slug}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export function getStoreUrl(slug: string): string {
  return `https://autoon.kr/store/${slug}`
}
