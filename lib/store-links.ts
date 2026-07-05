/** Canonical QR / universal link URLs for customer store pages. */

const WEB_ORIGIN = 'https://autoon.kr'
const APP_SCHEME = 'autoon'
const ANDROID_PACKAGE = 'kr.autoon.app'

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`

export function normalizeStoreSlug(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** https://autoon.kr/store/{slug} — QR & universal link */
export function getStoreWebUrl(slug: string): string {
  const normalized = normalizeStoreSlug(slug)
  return `${WEB_ORIGIN}/store/${encodeURIComponent(normalized)}`
}

/** autoon://store/{slug} — custom scheme fallback */
export function getStoreDeepLink(slug: string): string {
  const normalized = normalizeStoreSlug(slug)
  return `${APP_SCHEME}://store/${encodeURIComponent(normalized)}`
}

/** Play Store with install referrer for deferred deep link (Android). */
export function getPlayStoreUrl(slug: string): string {
  const normalized = normalizeStoreSlug(slug)
  const referrer = encodeURIComponent(`store_slug=${normalized}`)
  return `${PLAY_STORE_URL}&referrer=${referrer}`
}
