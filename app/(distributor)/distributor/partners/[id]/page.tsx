'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchDistributorPartnerDetail, type DistributorPartnerDetail } from '@/lib/distributor-api'

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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-stone-100 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="text-sm text-stone-800 sm:col-span-2">{value ?? '-'}</dd>
    </div>
  )
}

export default function DistributorPartnerDetailPage() {
  const params = useParams()
  const id = String(params.id ?? '')
  const [data, setData] = useState<DistributorPartnerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await fetchDistributorPartnerDetail(id)
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '업체 정보를 불러오지 못했습니다.')
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
        <Link href="/distributor/partners" className="text-sm text-indigo-700 hover:text-indigo-900">← 업체</Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{data.partnerName}</h1>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-5">
        <dl>
          <Row label="상태" value={data.status} />
          <Row label="대표자" value={data.ownerName} />
          <Row label="연락처" value={data.phone} />
          <Row label="이메일" value={data.email} />
          <Row label="주소" value={data.address} />
          <Row label="업종" value={data.bizType} />
          <Row label="사업자번호" value={data.businessRegistrationNo} />
          <Row label="플랜" value={data.planTier} />
          <Row label="무료체험" value={data.isFreeTrial ? '예' : '아니오'} />
          <Row label="영업점" value={data.agencyName} />
          <Row label="담당 사원" value={data.agentName} />
          <Row label="예상 수수료" value={formatMoney(data.estimatedCommission)} />
          <Row label="배정일" value={formatDate(data.assignedAt)} />
          <Row label="메모" value={data.memo} />
        </dl>
      </div>
    </div>
  )
}
