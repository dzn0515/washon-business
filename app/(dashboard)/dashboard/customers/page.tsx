'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useCustomers, type CustomerRow } from '@/lib/hooks/useCustomers'
import { CARD, won, AVATAR_COLORS, BTN_PRIMARY } from '@/lib/dashboard-ui'
import { CUSTOMER_GRADE_LABEL, CUSTOMER_GRADE_STYLE } from '@/constants'
import type { CustomerGrade } from '@/types'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const {
    customers,
    stats,
    total,
    page,
    pageSize,
    setPage,
    loading,
    error,
    refetch,
  } = useCustomers(query)
  const { href } = useDemoMode()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">고객 관리</h2>
        <span className="text-sm text-gray-400">총 {stats.total.toLocaleString()}명</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">전체 고객</p>
          <p className="text-lg font-semibold">{stats.totalCustomers.toLocaleString()}명</p>
          <p className="text-[11px] text-green-600 mt-1">이번 달 신규 {stats.newCustomersThisMonth}명</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">재방문</p>
          <p className="text-lg font-semibold">{stats.returningCustomers}명</p>
          <p className="text-[11px] text-gray-400 mt-1">재방문율 {stats.repeatRate}%</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">휴면 (90일+)</p>
          <p className="text-lg font-semibold">{stats.dormantCustomers}명</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">VIP (10회+)</p>
          <p className="text-lg font-semibold">{stats.vip}명</p>
          <p className="text-[11px] text-gray-400 mt-1">단골 {stats.regular}명 ({stats.regular_pct}%)</p>
        </div>
      </div>

      <form
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(search.trim())
        }}
      >
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 연락처, 차량"
          className="flex-1 text-sm outline-none bg-transparent"
        />
        <button type="submit" className="text-xs text-blue-600 font-medium shrink-0">
          검색
        </button>
      </form>

      {loading ? <p className="text-xs text-gray-400">불러오는 중...</p> : null}
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>고객 목록을 불러오지 못했습니다.</span>
          <button type="button" className={BTN_PRIMARY} onClick={() => void refetch()}>
            다시 시도
          </button>
        </div>
      ) : null}

      {!loading && !error && customers.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">아직 등록된 고객이 없습니다.</p>
      ) : null}

      <div className="space-y-2">
        {customers.map((c: CustomerRow, i: number) => (
          <Link
            key={c.id}
            href={href(`/dashboard/customers/${c.id}`)}
            className={`${CARD} block hover:border-blue-200 transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
              >
                {c.name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <Badge className={CUSTOMER_GRADE_STYLE[c.grade as CustomerGrade]}>
                    {CUSTOMER_GRADE_LABEL[c.grade as CustomerGrade]}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {c.phone} · {c.car_model} · 방문 {c.visit_count}회 · {won(c.total_spent)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  최근 {c.last_visit_at} · 다음 {c.next_reservation_at} · 쿠폰 {c.coupon_count}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{won(c.total_spent)}</span>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            이전
          </button>
          <span className="text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  )
}
