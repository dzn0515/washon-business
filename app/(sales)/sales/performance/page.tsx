'use client'

import { useEffect, useState } from 'react'
import {
  fetchSalesPerformance,
  type SalesPerformance,
  type SalesPerformancePeriod,
} from '@/lib/sales-api'

const PERIODS: { value: SalesPerformancePeriod; label: string }[] = [
  { value: 'month', label: '이번 달' },
  { value: 'quarter', label: '분기' },
  { value: 'year', label: '연간' },
]

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function SalesPerformancePage() {
  const [period, setPeriod] = useState<SalesPerformancePeriod>('month')
  const [data, setData] = useState<SalesPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchSalesPerformance(period)
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
        { label: '신규 업체', value: data.newPartners },
        { label: '활성 업체', value: data.activePartners },
        { label: '무료체험', value: data.freeTrialPartners },
        { label: '유료 전환', value: data.paidPartners },
        { label: '예상 수수료', value: formatMoney(data.estimatedCommission) },
      ]
    : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">실적</h1>
          <p className="mt-1 text-sm text-stone-500">기간별 영업 실적입니다.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={[
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                period === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-600 hover:bg-stone-50',
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xl font-bold text-teal-900 sm:text-2xl">{c.value}</p>
              <p className="mt-1 text-xs text-stone-500">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
