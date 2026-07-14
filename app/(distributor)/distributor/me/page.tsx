'use client'

import { useEffect, useState } from 'react'
import { fetchDistributorMe, type DistributorMe } from '@/lib/distributor-api'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-stone-100 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="text-sm text-stone-800 sm:col-span-2">{value ?? '-'}</dd>
    </div>
  )
}

export default function DistributorMePage() {
  const [data, setData] = useState<DistributorMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchDistributorMe()
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '프로필을 불러오지 못했습니다.')
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
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">내 정보</h1>
        <p className="mt-1 text-sm text-stone-500">총판 프로필입니다.</p>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-5">
        <dl>
          <Row label="총판명" value={data.name} />
          <Row label="코드" value={data.code} />
          <Row label="대표자" value={data.representativeName} />
          <Row label="계정 이메일" value={data.accountEmail} />
          <Row label="연락처" value={data.phone} />
          <Row label="이메일" value={data.email} />
          <Row label="지역" value={data.region} />
          <Row label="상태" value={<span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{data.status}</span>} />
          <Row
            label="배분 정책"
            value={
              data.agentShare != null
                ? `영업사원 ${data.agentShare}% / 영업점 ${data.agencyShare}% / 총판 ${data.distributorShare}%`
                : '미설정'
            }
          />
        </dl>
      </div>
    </div>
  )
}
