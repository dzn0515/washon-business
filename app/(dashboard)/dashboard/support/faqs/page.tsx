'use client'

import { useEffect, useState } from 'react'
import { fetchSupportFaqs } from '@/lib/support-api'

export default function OwnerSupportFaqsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSupportFaqs()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : '로드 실패'))
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">FAQ</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {items.map((f) => (
          <details key={String(f.id)} className="border rounded-xl bg-white p-4">
            <summary className="font-medium cursor-pointer">{String(f.title)}</summary>
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{String(f.content)}</p>
          </details>
        ))}
        {!error && items.length === 0 && <p className="text-sm text-gray-500">등록된 FAQ가 없습니다.</p>}
      </div>
    </div>
  )
}
