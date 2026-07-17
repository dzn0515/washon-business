'use client'

import { useEffect, useState } from 'react'
import { fetchSupportNotices } from '@/lib/support-api'

export default function OwnerSupportNoticesPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSupportNotices()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : '로드 실패'))
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">공지사항</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {items.map((n) => (
          <article key={String(n.id)} className="border rounded-xl bg-white p-4">
            <div className="text-xs text-gray-500">
              {n.isImportant ? '중요 · ' : ''}
              {String(n.publishedAt || n.createdAt || '').slice(0, 10)}
            </div>
            <h2 className="font-medium mt-1">{String(n.title)}</h2>
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{String(n.content)}</p>
          </article>
        ))}
        {!error && items.length === 0 && <p className="text-sm text-gray-500">게시 중인 공지가 없습니다.</p>}
      </div>
    </div>
  )
}
