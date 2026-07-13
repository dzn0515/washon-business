'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchSalesSettlement, type SalesSettlementDetail } from '@/lib/sales-api'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '초안',
  CALCULATED: '산출됨',
  CONFIRMED: '확정',
  PAYMENT_PENDING: '지급대기',
  PAID: '지급완료',
  CANCELLED: '취소',
  PENDING: '대기',
  HELD: '보류',
}

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ko-KR')
}

export default function SalesSettlementDetailPage() {
  const params = useParams()
  const id = String(params?.id ?? '')
  const [data, setData] = useState<SalesSettlementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchSalesSettlement(id)
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '정산을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="text-sm text-stone-400">불러오는 중...</p>
  if (error) return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <Link href="/sales/settlements" className="text-sm text-teal-700 hover:underline">
            ← 정산 내역
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-stone-900">{data.settlementMonth} 정산</h1>
          <p className="mt-1 text-sm text-stone-500">
            {STATUS_LABEL[data.status] ?? data.status} · 지급일 {formatDateTime(data.paidAt)}
          </p>
        </div>
        {!data.estimated ? (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
            확정 정산
          </span>
        ) : null}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-xs text-stone-500">내 수수료</p>
        <p className="mt-1 text-3xl font-bold text-teal-900">{formatMoney(data.commissionAmount)}</p>
        <p className="mt-2 text-sm text-stone-500">
          요율 {data.commissionRate}% · 대상 업체 {data.eligiblePartnerCount}곳
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">업체</th>
              <th className="px-4 py-3 font-medium">결제액</th>
              <th className="px-4 py-3 font-medium">내 수수료</th>
              <th className="px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.lines.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-stone-400">
                  실제 구독 결제 기록이 수집된 이후 정산 가능합니다.
                </td>
              </tr>
            ) : (
              data.lines.map((line) => (
                <tr key={line.id} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">{line.partnerName}</p>
                    <p className="text-xs text-stone-400">{line.planTier}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{formatMoney(line.paymentNetAmount)}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {formatMoney(line.commissionAmount)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {STATUS_LABEL[line.status] ?? line.status}
                    {line.holdReason ? (
                      <span className="ml-1 text-xs text-amber-700">({line.holdReason})</span>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
