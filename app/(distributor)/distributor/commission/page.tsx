'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchDistributorCommission, type DistributorCommission } from '@/lib/distributor-api'

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function DistributorCommissionPage() {
  const [data, setData] = useState<DistributorCommission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchDistributorCommission()
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
          <p className="mt-1 text-sm text-stone-500">총판 몫(distributorRate) 예상 수수료입니다.</p>
        </div>
        {data.estimated && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">예상(Estimated)</span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs text-stone-500">이번 달</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(data.thisMonth)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs text-stone-500">다음 달 예상</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(data.nextMonthEstimate)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs text-stone-500">연간 예상</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(data.yearlyEstimate)}</p>
        </div>
      </div>
      <p className="text-sm text-stone-500">총판 요율: {String(data.distributorRate)}</p>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">업체</th>
              <th className="px-4 py-3 font-medium">영업점/사원</th>
              <th className="px-4 py-3 font-medium">총판 수수료</th>
              <th className="px-4 py-3 font-medium">잔여 월</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.partnerBreakdown.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-stone-400">수수료 내역이 없습니다.</td></tr>
            ) : (
              data.partnerBreakdown.map((item) => (
                <tr key={item.partnerId} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/distributor/partners/${item.partnerId}`} className="font-medium text-slate-800 hover:text-indigo-700">{item.partnerName}</Link>
                    <span className="ml-2 text-xs text-stone-400">{item.planTier}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.agencyName ?? '-'} / {item.agentName ?? '-'}</td>
                  <td className="px-4 py-3 font-medium">{formatMoney(item.distributorCommission)}</td>
                  <td className="px-4 py-3 text-stone-600">{item.remainingMonths}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
