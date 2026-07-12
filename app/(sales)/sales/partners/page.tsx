'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchSalesPartners,
  type SalesPartnerListItem,
} from '@/lib/sales-api'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'ACTIVE', label: '운영중' },
  { value: 'PENDING', label: '대기' },
  { value: 'INACTIVE', label: '비활성' },
]

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

export default function SalesPartnersPage() {
  const [items, setItems] = useState<SalesPartnerListItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchSalesPartners({
        keyword: keyword || undefined,
        status,
        page,
        pageSize: PAGE_SIZE,
      })
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '업체 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [keyword, status, page])

  useEffect(() => {
    void load()
  }, [load])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">내 업체</h1>
          <p className="mt-1 text-sm text-stone-500">배정된 업체를 검색·조회합니다.</p>
        </div>
        <Link
          href="/sales/apply"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          입점 신청
        </Link>
      </div>

      <form onSubmit={onSearch} className="flex flex-wrap gap-2">
        <input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="업체명·연락처 검색"
          className="min-w-[180px] flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          검색
        </button>
      </form>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">업체명</th>
              <th className="px-4 py-3 font-medium">대표</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">플랜</th>
              <th className="px-4 py-3 font-medium">예상 수수료</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-stone-400">
                  불러오는 중...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-stone-400">
                  업체가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.partnerId} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/sales/partners/${item.partnerId}`}
                      className="font-medium text-teal-800 hover:text-emerald-700"
                    >
                      {item.partnerName}
                    </Link>
                    {item.isFreeTrial && (
                      <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        체험
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.ownerName ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.planTier}</td>
                  <td className="px-4 py-3 text-stone-700">{formatMoney(item.estimatedCommission)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          총 {total}건 · {page}/{Math.max(totalPages, 1)} 페이지
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-40"
          >
            이전
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
