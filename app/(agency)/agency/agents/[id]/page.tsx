'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchAgencyAgentDetail, type AgencyAgentDetail } from '@/lib/agency-api'

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-stone-100 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="text-sm text-stone-800 sm:col-span-2">{value ?? '-'}</dd>
    </div>
  )
}

export default function AgencyAgentDetailPage() {
  const params = useParams()
  const id = String(params.id ?? '')
  const [data, setData] = useState<AgencyAgentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchAgencyAgentDetail(id)
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '영업사원 정보를 불러오지 못했습니다.')
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
      <div>
        <Link href="/agency/agents" className="text-sm text-emerald-700 hover:text-emerald-900">← 영업사원</Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{data.name}</h1>
        <p className="mt-1 text-sm text-stone-500">{data.code}</p>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-5">
        <dl>
          <Row label="상태" value={data.status} />
          <Row label="고용유형" value={data.employmentType} />
          <Row label="연락처" value={data.phone} />
          <Row label="이메일" value={data.email} />
          <Row label="업체 수" value={data.partnerCount} />
          <Row label="예상 수수료" value={formatMoney(data.estimatedMonthlyCommission)} />
          <Row label="메모" value={data.memo} />
        </dl>
      </div>
      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-5 py-3"><h2 className="text-sm font-semibold">담당 업체</h2></div>
        {(data.partners ?? []).length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-400">업체가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {data.partners.map((p) => (
              <li key={p.partnerId} className="px-5 py-3 text-sm">
                <Link href={`/agency/partners/${p.partnerId}`} className="font-medium text-emerald-800 hover:text-emerald-700">{p.partnerName}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
