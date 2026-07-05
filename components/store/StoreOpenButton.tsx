'use client'

import { useRef } from 'react'
import { getPlayStoreUrl, getStoreDeepLink } from '@/lib/store-links'

type Props = {
  slug: string
  brandColor?: string
}

/**
 * Tap to open AUTOON app; falls back to Play Store if not installed.
 * No auto-launch on page load — user must tap the button.
 */
export default function StoreOpenButton({ slug, brandColor = '#1A6DFF' }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openInApp() {
    const deepLink = getStoreDeepLink(slug)

    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const onVisibility = () => {
      if (document.hidden) cleanup()
    }

    const onBlur = () => cleanup()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    window.location.href = deepLink

    timerRef.current = setTimeout(() => {
      cleanup()
      window.location.href = getPlayStoreUrl(slug)
    }, 2500)
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto w-full max-w-lg px-4 pt-3">
        <button
          type="button"
          onClick={openInApp}
          className="w-full max-w-full rounded-xl py-3.5 text-base font-semibold text-white shadow-sm transition-opacity active:opacity-90"
          style={{ backgroundColor: brandColor }}
        >
          앱에서 예약하기
        </button>
      </div>
    </div>
  )
}
