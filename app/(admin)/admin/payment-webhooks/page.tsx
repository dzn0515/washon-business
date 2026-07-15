'use client'

import { useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { fetchAdminPaymentWebhooks } from '@/lib/admin-api'

export default function AdminPaymentWebhooksPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminPaymentWebhooks(1)
      .then((r) => setItems(r.items))
      .catch((e) => setError(e instanceof Error ? e.message : '실패'))
  }, [])

  return (
    <div className="space-y-4 p-6">
      <AdminPageHeader title="결제 웹훅 로그" description="Toss/Mock webhook 수신·처리 상태" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">provider</th>
              <th className="px-3 py-2 text-left">event</th>
              <th className="px-3 py-2 text-left">status</th>
              <th className="px-3 py-2 text-left">error</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={String(w.id)} className="border-t">
                <td className="px-3 py-2">{String(w.id)}</td>
                <td className="px-3 py-2">{String(w.provider)}</td>
                <td className="px-3 py-2">{String(w.event_type)}</td>
                <td className="px-3 py-2">{String(w.processing_status)}</td>
                <td className="px-3 py-2">{String(w.error_message ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
