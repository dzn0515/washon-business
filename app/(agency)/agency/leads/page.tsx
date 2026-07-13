'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchAgencyLeads, type AgencyLead } from '@/lib/agency-api'

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

export default function AgencyLeadsPage() {
  const [items, setItems] = useState<AgencyLead[]>([])
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAgencyLeads({
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
      <div>
        <h1 className="text-2xl font-bold text-stone-900">입점 신청</h1>
        <p className="mt-1 text-sm text-stone-500">소속 영업사원이 작성한 신청을 조회합니다. (승인 권한 없음)</p>
      </div>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm">
        <option value="all">전체 상태</option>
        <option value="NEW">신규</option>
        <option value="REVIEWING">검토중</option>
        <option value="REJECTED">반려</option>
        <option value="CONVERTED">완료</option>
      </select>
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}
      {loading ? (
        <p className="text-sm text-stone-500">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-stone-500">신청 내역이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <div key={row.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">{row.companyName}</p>
                  <p className="text-sm text-stone-500">{row.ownerName} · {row.phone} · {row.email}</p>
                  <p className="mt-1 text-xs text-stone-400">사원 {row.salesAgentName ?? '-'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status] ?? 'bg-stone-100 text-stone-600'}`}>
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </div>
              {row.address ? <p className="mt-2 text-sm text-stone-600">{row.address}</p> : null}
              {row.status === 'REJECTED' && row.rejectionReason ? (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">반려 사유: {row.rejectionReason}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
