'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useCustomers, type CustomerRow } from '@/lib/hooks/useCustomers'
import { mockCustomerStats } from '@/lib/mock/data'
import { CARD, won, AVATAR_COLORS } from '@/lib/dashboard-ui'
import { CUSTOMER_GRADE_LABEL, CUSTOMER_GRADE_STYLE } from '@/constants'
import type { CustomerGrade } from '@/types'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const { customers, stats, loading, isLive } = useCustomers(query)
  const { isDemo, href } = useDemoMode()

  const filtered = useMemo(() => customers, [customers])

  function submitSearch() {
    setQuery(search.trim())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">고객 관리</h2>
        <span className="text-sm text-gray-400">총 {(isLive ? stats : mockCustomerStats).total.toLocaleString()}명</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">전체 고객</p>
          <p className="text-lg font-semibold">{stats.total.toLocaleString()}명</p>
          <p className="text-[11px] text-green-600 mt-1">신규 {stats.new}명</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">단골 (3회+)</p>
          <p className="text-lg font-semibold">{stats.regular}명</p>
          <p className="text-[11px] text-gray-400 mt-1">{stats.regular_pct}%</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">VIP (10회+)</p>
          <p className="text-lg font-semibold">{stats.vip}명</p>
        </div>
      </div>

      <form
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault()
          submitSearch()
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
      {!isLive && !loading ? (
        <p className="text-xs text-amber-600">{isDemo ? '데모 데이터 (PC 프로그램 미리보기)' : '데모 데이터 표시 중'}</p>
      ) : null}

      <div className="space-y-2">
        {filtered.map((c: CustomerRow, i: number) => (
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
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <Badge className={CUSTOMER_GRADE_STYLE[c.grade as CustomerGrade]}>
                    {CUSTOMER_GRADE_LABEL[c.grade as CustomerGrade]}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {c.phone} · {c.car_model} · 방문 {c.visit_count}회 · {c.last_visit_at}
                </p>
                {c.memo ? (
                  <p className="text-xs text-gray-500 mt-1 truncate">{c.memo}</p>
                ) : null}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{won(c.total_spent)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
