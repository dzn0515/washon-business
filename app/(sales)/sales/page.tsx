'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchSalesDashboard, type SalesDashboard } from '@/lib/sales-api'

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR')
  } catch {
    return iso
  }
}

export default function SalesDashboardPage() {
  const [data, setData] = useState<SalesDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchSalesDashboard()
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '대시보드를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-stone-400">불러오는 중...</p>
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
  }

  if (!data) return null

  const cards = [
    { label: '오늘 상담', value: data.todayConsultations },
    { label: '입점 완료', value: data.onboardedCount },
    { label: '진행 중', value: data.inProgressCount },
    { label: '내 업체', value: data.myPartnersCount },
    { label: '이번 달 신규', value: data.newPartnersThisMonth },
    { label: '예상 수수료(월)', value: formatMoney(data.estimatedMonthCommission) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">영업 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-xl font-bold text-teal-900 sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-xs text-stone-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sales/partners"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          내 업체 보기
        </Link>
        <Link
          href="/sales/apply"
          className="rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
        >
          입점 신청
        </Link>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-stone-800">최근 활동</h2>
        </div>
        {data.recentActivities.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-stone-400">최근 활동이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {data.recentActivities.map((a, i) => (
              <li key={`${a.partnerId}-${a.at}-${i}`} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                  {a.type}
                </span>
                <Link href={`/sales/partners/${a.partnerId}`} className="font-medium text-stone-800 hover:text-emerald-700">
                  {a.partnerName}
                </Link>
                {a.status && <span className="text-xs text-stone-400">{a.status}</span>}
                <span className="ml-auto text-xs text-stone-400">{formatDate(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
