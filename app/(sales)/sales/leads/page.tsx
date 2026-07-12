'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchSalesLeads, type SalesLead } from '@/lib/sales-api'

const STATUS_LABEL: Record<string, string> = {
  NEW: '신규',
  REVIEWING: '검토중',
  APPROVED: '승인',
  REJECTED: '반려',
  CONVERTED: '완료',
}

const STATUS_CLASS: Record<string, string> = {
  NEW: 'bg-stone-100 text-stone-700',
  REVIEWING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-red-50 text-red-700',
  CONVERTED: 'bg-emerald-50 text-emerald-700',
}

export default function SalesLeadsPage() {
  const [items, setItems] = useState<SalesLead[]>([])
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchSalesLeads({
        status: status === 'all' ? undefined : status,
        pageSize: 50,
      })
      setItems(res.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '신청 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">내 신청</h1>
          <p className="mt-1 text-sm text-stone-500">입점 신청 상태와 승인 결과를 확인합니다.</p>
        </div>
        <Link
          href="/sales/apply"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
        >
          + 입점 신청
        </Link>
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
      >
        <option value="all">전체 상태</option>
        <option value="NEW">신규</option>
        <option value="REVIEWING">검토중</option>
        <option value="REJECTED">반려</option>
        <option value="CONVERTED">완료</option>
      </select>

      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-sm text-stone-500">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-stone-500">신청 내역이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">{row.companyName}</p>
                  <p className="text-sm text-stone-500">
                    {row.ownerName} · {row.phone} · {row.email}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_CLASS[row.status] ?? 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </div>
              {row.address ? <p className="mt-2 text-sm text-stone-600">{row.address}</p> : null}
              {row.status === 'REJECTED' && row.rejectionReason ? (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  반려 사유: {row.rejectionReason}
                </p>
              ) : null}
              {row.partnerCreated && row.partnerId ? (
                <div className="mt-3 space-y-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <p className="font-medium">승인 완료 · 업체 생성 완료</p>
                  <p>
                    Partner: {row.partnerName || row.companyName}
                    {row.partnerSlug ? ` (${row.partnerSlug})` : ''}
                  </p>
                  <p>Owner 로그인 이메일: {row.ownerLoginEmail || row.email}</p>
                  <Link
                    href={`/sales/partners/${row.partnerId}`}
                    className="inline-block text-emerald-700 underline"
                  >
                    업체 보기
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
