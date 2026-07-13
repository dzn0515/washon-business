'use client'

import { useEffect, useState } from 'react'
import {
  fetchDistributorPerformance,
  type DistributorPerformance,
  type DistributorPerformancePeriod,
} from '@/lib/distributor-api'

const PERIODS: { value: DistributorPerformancePeriod; label: string }[] = [
  { value: 'month', label: '이번 달' },
  { value: 'quarter', label: '분기' },
  { value: 'year', label: '연간' },
]

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function DistributorPerformancePage() {
  const [period, setPeriod] = useState<DistributorPerformancePeriod>('month')
  const [data, setData] = useState<DistributorPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchDistributorPerformance(period)
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '실적을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [period])

  const cards = data
    ? [
        { label: '신규 Lead', value: data.newLeads },
        { label: '전환 Lead', value: data.convertedLeads },
        { label: '반려 Lead', value: data.rejectedLeads },
        { label: '신규 업체', value: data.newPartners },
        { label: '활성 업체', value: data.activePartners },
        { label: '무료체험', value: data.freeTrialPartners },
        { label: '유료 전환', value: data.paidPartners },
        { label: '전환율', value: `${(data.conversionRate * 100).toFixed(1)}%` },
      ]
    : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">실적</h1>
          <p className="mt-1 text-sm text-stone-500">기간별 총판 실적입니다.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={[
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                period === p.value ? 'bg-indigo-600 text-white' : 'text-stone-600 hover:bg-stone-50',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {loading ? (
        <p className="text-sm text-stone-400">불러오는 중...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">{c.value}</p>
                <p className="mt-1 text-xs text-stone-500">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-stone-200 bg-white">
              <div className="border-b border-stone-100 px-5 py-3"><h2 className="text-sm font-semibold">영업점별</h2></div>
              {(data?.agencyBreakdown ?? []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-stone-400">데이터 없음</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {data!.agencyBreakdown.map((row) => (
                    <li key={row.id} className="flex justify-between px-5 py-3 text-sm">
                      <span>{row.name} <span className="text-stone-400">({row.count})</span></span>
                      <span>{formatMoney(row.estimatedCommission)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-xl border border-stone-200 bg-white">
              <div className="border-b border-stone-100 px-5 py-3"><h2 className="text-sm font-semibold">영업사원별</h2></div>
              {(data?.agentBreakdown ?? []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-stone-400">데이터 없음</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {data!.agentBreakdown.map((row) => (
                    <li key={row.id} className="flex justify-between px-5 py-3 text-sm">
                      <span>{row.name} <span className="text-stone-400">({row.count})</span></span>
                      <span>{formatMoney(row.estimatedCommission)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
