'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchSalesCommission, type SalesCommission } from '@/lib/sales-api'

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function SalesCommissionPage() {
  const [data, setData] = useState<SalesCommission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchSalesCommission()
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '수수료를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="text-sm text-stone-400">불러오는 중...</p>
  if (error) return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">수수료</h1>
          <p className="mt-1 text-sm text-stone-500">
            유료 개월차 기준 예상 수수료입니다. (무료체험 제외 · VAT 제외)
          </p>
        </div>
        {data.estimated && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            예상(Estimated)
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs text-stone-500">이번달 지급액(예상)</p>
          <p className="mt-1 text-3xl font-bold text-teal-900">{formatMoney(data.monthTotal)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs text-stone-500">다음달 지급 예상액</p>
          <p className="mt-1 text-3xl font-bold text-stone-800">
            {formatMoney(data.nextMonthTotal ?? 0)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">업체</th>
              <th className="px-4 py-3 font-medium">플랜</th>
              <th className="px-4 py-3 font-medium">유료 개월차</th>
              <th className="px-4 py-3 font-medium">적용 요율</th>
              <th className="px-4 py-3 font-medium">이번달</th>
              <th className="px-4 py-3 font-medium">다음달 예상</th>
              <th className="px-4 py-3 font-medium">남은 지급 개월</th>
              <th className="px-4 py-3 font-medium">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-stone-400">
                  수수료 내역이 없습니다.
                </td>
              </tr>
            ) : (
              data.items.map((item) => (
                <tr key={item.partnerId} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/sales/partners/${item.partnerId}`}
                      className="font-medium text-teal-800 hover:text-emerald-700"
                    >
                      {item.partnerName}
                    </Link>
                    {item.estimated && (
                      <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        예상
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.planTier}</td>
                  <td className="px-4 py-3 text-stone-800">
                    {item.commissionMonth > 0
                      ? `유료 ${item.commissionMonth}개월차`
                      : '무료체험'}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {item.appliedTierRate != null ? `${item.appliedTierRate}%` : '-'}
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {formatMoney(item.agentCommission)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatMoney(item.nextMonthAgentCommission ?? 0)}
                    {item.nextMonthTierRate != null ? (
                      <span className="ml-1 text-xs text-stone-400">
                        ({item.nextMonthTierRate}%)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.remainingMonths}</td>
                  <td className="px-4 py-3 text-stone-500">{item.note ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
