'use client'

import { useEffect, useState } from 'react'

export default function UpdateNotifier() {
  const [status, setStatus] = useState<'idle' | 'available' | 'downloaded'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return

    const api = window.electronAPI
    api.onUpdateAvailable(() => setStatus('available'))
    api.onUpdateDownloaded(() => setStatus('downloaded'))
  }, [])

  if (status === 'idle') return null

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-blue-200 rounded-xl shadow-lg p-4 z-50 max-w-sm">
      {status === 'available' && (
        <p className="text-sm text-gray-700">새 버전을 다운로드 중입니다...</p>
      )}
      {status === 'downloaded' && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-900">업데이트 준비 완료</p>
          <p className="text-sm text-gray-600">
            지금 재시작하면 최신 버전으로 업데이트됩니다.
          </p>
          <button
            type="button"
            onClick={() => window.electronAPI?.installUpdate()}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            지금 업데이트
          </button>
        </div>
      )}
    </div>
  )
}
