'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchDistributorDashboard, type DistributorDashboard } from '@/lib/distributor-api'

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function DistributorDashboardPage() {
  const [data, setData] = useState<DistributorDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchDistributorDashboard()
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

  if (loading) return <p className="text-sm text-stone-400">불러오는 중...</p>
  if (error) return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
  if (!data) return null

  const cards = [
    { label: '영업점', value: data.agencyCount },
    { label: '영업사원', value: data.agentCount },
    { label: '담당 업체', value: data.assignedPartnerCount },
    { label: '활성 업체', value: data.activePartnerCount },
    { label: '무료체험', value: data.freeTrialPartnerCount },
    { label: '이번 달 신규', value: data.thisMonthNewPartners },
    { label: '전환 Lead', value: data.convertedLeadCount },
    { label: '검토중 Lead', value: data.reviewingLeadCount },
    { label: '예상 수수료(월)', value: formatMoney(data.estimatedMonthlyCommission) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">대시보드</h1>
        <p className="mt-1 text-sm text-stone-500">총판 조직 현황을 한눈에 확인하세요.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-xs text-stone-500">{c.label}</p>
          </div>
        ))}
      </div>
      {data.agentShare != null ? (
        <div className="rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-700">
          <span className="font-medium text-stone-900">현재 배분 정책</span>
          <span className="ml-3">
            영업사원 {String(data.agentShare)}% · 영업점 {String(data.agencyShare)}% · 총판{' '}
            {String(data.distributorShare)}%
          </span>
          <span className="ml-2 text-xs text-stone-400">(총 수수료 풀 내부 분배)</span>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Link href="/distributor/agencies" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">영업점 보기</Link>
        <Link href="/distributor/partners" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">업체 보기</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: '최근 영업점', items: data.recentAgencies, base: '/distributor/agencies' },
          { title: '최근 영업사원', items: data.recentAgents, base: '/distributor/agents' },
          { title: '최근 업체', items: data.recentPartners, base: '/distributor/partners' },
          { title: '최근 입점 신청', items: data.recentLeads, base: '/distributor/leads' },
        ].map((section) => (
          <section key={section.title} className="rounded-xl border border-stone-200 bg-white">
            <div className="border-b border-stone-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-stone-800">{section.title}</h2>
            </div>
            {section.items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-400">데이터가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {section.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 px-5 py-3 text-sm">
                    <Link
                      href={section.base === '/distributor/leads' ? section.base : `${section.base}/${item.id}`}
                      className="font-medium text-slate-800 hover:text-indigo-700"
                    >
                      {item.name}
                    </Link>
                    {item.status ? <span className="text-xs text-stone-400">{item.status}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
