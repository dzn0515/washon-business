'use client'

import { useCallback, useRef, useState } from 'react'
import {
  getAndroidIntentUrl,
  getPlayStoreUrl,
  getStoreDeepLink,
  normalizeStoreSlug,
} from '@/lib/store-links'

type Props = {
  slug: string
  brandColor?: string
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/**
 * Tap to open AUTOON app; falls back to Play Store if not installed.
 * No auto-launch on page load — user must tap the button.
 */
export default function StoreOpenButton({ slug, brandColor = '#1A6DFF' }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openingRef = useRef(false)
  const [opening, setOpening] = useState(false)

  const clearFallbackTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleOpenApp = useCallback(() => {
    if (openingRef.current) return
    openingRef.current = true
    setOpening(true)
    clearFallbackTimer()

    const normalizedSlug = normalizeStoreSlug(slug)
    if (!normalizedSlug) {
      window.location.assign(getPlayStoreUrl(''))
      openingRef.current = false
      setOpening(false)
      return
    }

    const playStoreUrl = getPlayStoreUrl(normalizedSlug)

    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('blur', onBlur)
      clearFallbackTimer()
      openingRef.current = false
      setOpening(false)
    }

    const onVisibility = () => {
      if (document.hidden) cleanup()
    }

    const onPageHide = () => cleanup()

    const onBlur = () => cleanup()

    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('pagehide', onPageHide)
    window.addEventListener('blur', onBlur)

    if (isAndroid()) {
      // Samsung Browser: intent URL + browser_fallback_url (Play Store)
      const intentUrl = getAndroidIntentUrl(normalizedSlug, playStoreUrl)
      window.location.assign(intentUrl)
      timerRef.current = setTimeout(() => {
        cleanup()
        window.location.assign(playStoreUrl)
      }, 2000)
      return
    }

    // iOS / desktop: custom scheme then Play Store
    const schemeUrl = getStoreDeepLink(normalizedSlug)
    window.location.assign(schemeUrl)

    timerRef.current = setTimeout(() => {
      cleanup()
      window.location.assign(playStoreUrl)
    }, 1200)
  }, [slug, clearFallbackTimer])

  const normalizedSlug = normalizeStoreSlug(slug)
  const androidIntentHref = normalizedSlug
    ? getAndroidIntentUrl(normalizedSlug, getPlayStoreUrl(normalizedSlug))
    : getPlayStoreUrl('')

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto w-full max-w-lg px-4 pt-3">
        {isAndroid() ? (
          <a
            href={androidIntentHref}
            role="button"
            onClick={(e) => {
              e.preventDefault()
              handleOpenApp()
            }}
            className="flex w-full max-w-full cursor-pointer select-none items-center justify-center rounded-xl py-3.5 text-base font-semibold text-white shadow-sm transition-opacity active:opacity-90 touch-manipulation"
            style={{ backgroundColor: brandColor, WebkitTapHighlightColor: 'transparent' }}
          >
            {opening ? '앱 여는 중…' : '앱에서 예약하기'}
          </a>
        ) : (
          <button
            type="button"
            onClick={handleOpenApp}
            disabled={opening}
            className="w-full max-w-full cursor-pointer select-none rounded-xl py-3.5 text-base font-semibold text-white shadow-sm transition-opacity active:opacity-90 touch-manipulation disabled:opacity-80"
            style={{ backgroundColor: brandColor, WebkitTapHighlightColor: 'transparent' }}
          >
            {opening ? '앱 여는 중…' : '앱에서 예약하기'}
          </button>
        )}
      </div>
    </div>
  )
}
