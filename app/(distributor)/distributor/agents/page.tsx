'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchDistributorAgents, type DistributorAgentListItem } from '@/lib/distributor-api'

const PAGE_SIZE = 20

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function DistributorAgentsPage() {
  const [items, setItems] = useState<DistributorAgentListItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [status, setStatus] = useState('all')
  const [agencyId, setAgencyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchDistributorAgents({
        keyword: keyword || undefined,
        status,
        agencyId: agencyId || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '영업사원 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, agencyId, page])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">영업사원</h1>
        <p className="mt-1 text-sm text-stone-500">총판 직속·소속 영업점 영업사원을 조회합니다.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setKeyword(keywordInput.trim())
        }}
        className="flex flex-wrap gap-2"
      >
        <input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} placeholder="이름·코드 검색" className="min-w-[180px] flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input value={agencyId} onChange={(e) => { setPage(1); setAgencyId(e.target.value) }} placeholder="영업점 ID" className="w-32 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">
          <option value="all">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
          <option value="SUSPENDED">정지</option>
        </select>
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white">검색</button>
      </form>
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">영업사원</th>
              <th className="px-4 py-3 font-medium">영업점</th>
              <th className="px-4 py-3 font-medium">고용유형</th>
              <th className="px-4 py-3 font-medium">업체</th>
              <th className="px-4 py-3 font-medium">예상 수수료</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-400">불러오는 중...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-400">영업사원이 없습니다.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/distributor/agents/${item.id}`} className="font-medium text-slate-800 hover:text-indigo-700">{item.name}</Link>
                    <p className="text-xs text-stone-400">{item.code}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.agencyName ?? '총판 직속'}</td>
                  <td className="px-4 py-3 text-stone-600">{item.employmentType}</td>
                  <td className="px-4 py-3 text-stone-600">{item.partnerCount}</td>
                  <td className="px-4 py-3 text-stone-700">{formatMoney(item.estimatedMonthlyCommission)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>총 {total}건 · {page}/{Math.max(totalPages, 1)} 페이지</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-40">이전</button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-40">다음</button>
        </div>
      </div>
    </div>
  )
}
