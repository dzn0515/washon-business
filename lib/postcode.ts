export type DaumPostcodeResult = {
  zonecode: string
  roadAddress: string
  jibunAddress: string
}

type DaumPostcodeConstructor = new (options: {
  oncomplete: (data: DaumPostcodeResult) => void
}) => { open: () => void }

declare global {
  interface Window {
    daum?: {
      Postcode: DaumPostcodeConstructor
    }
  }
}

const POSTCODE_SCRIPT_SRC = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

let scriptLoading: Promise<void> | null = null

export function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 주소 검색을 사용할 수 있습니다.'))
  }
  if (window.daum?.Postcode) {
    return Promise.resolve()
  }
  if (scriptLoading) {
    return scriptLoading
  }

  scriptLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${POSTCODE_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('주소 검색 스크립트를 불러오지 못했습니다.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = POSTCODE_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('주소 검색 스크립트를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })

  return scriptLoading
}

export async function openDaumPostcode(onComplete: (data: DaumPostcodeResult) => void): Promise<void> {
  await loadDaumPostcodeScript()
  if (!window.daum?.Postcode) {
    throw new Error('주소 검색을 불러오지 못했습니다.')
  }
  new window.daum.Postcode({ oncomplete: onComplete }).open()
}

export function composeStoreAddress(roadAddress: string, detailAddress: string): string {
  const road = roadAddress.trim()
  const detail = detailAddress.trim()
  if (!road) return detail
  if (!detail) return road
  return `${road} ${detail}`
}
