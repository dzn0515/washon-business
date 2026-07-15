'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import {
  cancelAdminPartnerPayment,
  fetchAdminPartnerPayments,
  fetchAdminPgSettingsStatus,
} from '@/lib/admin-api'

function won(n: number) {
  return `${Number(n || 0).toLocaleString('ko-KR')}원`
}

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [total, setTotal] = useState(0)
  const [pg, setPg] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, status] = await Promise.all([
        fetchAdminPartnerPayments({ page: 1 }),
        fetchAdminPgSettingsStatus(),
      ])
      setItems(list.items)
      setTotal(list.total)
      setPg(status)
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onCancel(id: number) {
    const raw = window.prompt('부분 취소 금액 (전액은 비움)', '')
    if (raw === null) return
    const cancelAmount = raw.trim() === '' ? undefined : Number(raw)
    await cancelAdminPartnerPayment(id, {
      cancelAmount,
      cancelReason: 'admin UI cancel',
    })
    await load()
  }

  return (
    <div className="space-y-4 p-6">
      <AdminPageHeader title="결제 관리" description="예약 PG 결제·환불 (매장 GMV)" />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="text-blue-600 underline" href="/admin/partner-settlements">
          매장 정산
        </Link>
        <Link className="text-blue-600 underline" href="/admin/payment-webhooks">
          웹훅 로그
        </Link>
        <Link className="text-blue-600 underline" href="/admin/pg-settings">
          PG 설정 상태
        </Link>
      </div>

      {pg && (
        <div className="rounded border border-gray-200 bg-white p-3 text-xs text-gray-600">
          gateway={String(pg.payment_gateway)} mode={String(pg.payment_mode)} client=
          {String(pg.client_key_configured)} secret={String(pg.secret_key_configured)} webhook=
          {String(pg.webhook_configured)} payout={String(pg.payout_enabled)} billing=
          {String(pg.billing_enabled)}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">불러오는 중…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">파트너</th>
              <th className="px-3 py-2">금액</th>
              <th className="px-3 py-2">잔액</th>
              <th className="px-3 py-2">수수료</th>
              <th className="px-3 py-2">플랜</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">액션</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={String(p.id)} className="border-t">
                <td className="px-3 py-2">{String(p.id)}</td>
                <td className="px-3 py-2">{String(p.partner_id)}</td>
                <td className="px-3 py-2">{won(Number(p.approved_amount))}</td>
                <td className="px-3 py-2">{won(Number(p.balance_amount))}</td>
                <td className="px-3 py-2">{won(Number(p.platform_fee_amount ?? 0))}</td>
                <td className="px-3 py-2">{String(p.plan_tier_snapshot ?? '-')}</td>
                <td className="px-3 py-2">{String(p.status)}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-red-600 underline"
                    onClick={() => void onCancel(Number(p.id))}
                  >
                    취소
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t px-3 py-2 text-xs text-gray-500">총 {total}건</div>
      </div>
    </div>
  )
}
