'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchSalesSettlements,
  type SalesSettlementListItem,
} from '@/lib/sales-api'

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '초안',
  CALCULATED: '산출됨',
  CONFIRMED: '확정',
  PAYMENT_PENDING: '지급대기',
  PAID: '지급완료',
  CANCELLED: '취소',
}

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ko-KR')
}

export default function SalesSettlementsPage() {
  const [items, setItems] = useState<SalesSettlementListItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchSalesSettlements({ page, pageSize: PAGE_SIZE })
      setItems(list.items)
      setTotal(list.total)
      setTotalPages(list.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '정산 내역을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && items.length === 0) {
    return <p className="text-sm text-stone-400">불러오는 중...</p>
  }
  if (error && items.length === 0) {
    return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">정산 내역</h1>
          <p className="mt-1 text-sm text-stone-500">내 수수료 확정 정산 내역입니다.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
          확정 정산
        </span>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">정산월</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">내 수수료</th>
              <th className="px-4 py-3 font-medium">지급일</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-stone-400">
                  실제 구독 결제 기록이 수집된 이후 정산 가능합니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3 font-medium text-stone-800">{item.settlementMonth}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {STATUS_LABEL[item.status] ?? item.status}
                  </td>
                  <td className="px-4 py-3 font-medium text-teal-900">
                    {formatMoney(item.commissionAmount)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{formatDateTime(item.paidAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/sales/settlements/${item.id}`}
                      className="text-teal-800 hover:text-emerald-700"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-stone-600">
          <span>
            총 {total.toLocaleString('ko-KR')}건 · {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
