'use client'

import { useRef } from 'react'
import { getPlayStoreUrl, getStoreDeepLink } from '@/lib/store-links'

type Props = {
  slug: string
  brandColor?: string
}

/**
 * Opens AUTOON app via custom scheme; falls back to Play Store if app is not installed.
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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={openInApp}
          className="w-full rounded-xl py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: brandColor }}
        >
          앱에서 예약하기
        </button>
      </div>
    </div>
  )
}
