'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import {
  confirmAdminPartnerSettlement,
  fetchAdminPartnerSettlements,
  generateAdminPartnerSettlement,
  requestAdminPartnerPayout,
} from '@/lib/admin-api'

function won(n: number) {
  return `${Number(n || 0).toLocaleString('ko-KR')}원`
}

export default function AdminPartnerSettlementsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchAdminPartnerSettlements()
      setItems(res.items)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '실패')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onGenerate() {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 7)
    await generateAdminPartnerSettlement({
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    })
    await load()
  }

  return (
    <div className="space-y-4 p-6">
      <AdminPageHeader title="매장 정산" description="파트너 GMV 정산 배치 (영업 수수료 정산과 별개)" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
        onClick={() => void onGenerate()}
      >
        최근 7일 정산 생성
      </button>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">상태</th>
              <th className="px-3 py-2 text-left">순지급</th>
              <th className="px-3 py-2 text-left">액션</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={String(b.id)} className="border-t">
                <td className="px-3 py-2">{String(b.id)}</td>
                <td className="px-3 py-2">{String(b.status)}</td>
                <td className="px-3 py-2">{won(Number(b.net_payout_amount))}</td>
                <td className="space-x-2 px-3 py-2">
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void confirmAdminPartnerSettlement(Number(b.id)).then(load)}
                  >
                    확정
                  </button>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void requestAdminPartnerPayout(Number(b.id)).then(load)}
                  >
                    지급요청
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
