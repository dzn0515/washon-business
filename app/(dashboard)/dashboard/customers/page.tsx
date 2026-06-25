'use client'
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useCustomers, type CustomerRow } from '@/lib/hooks/useCustomers'
import { mockCustomerVisitHistory, getLongTermAbsentCount } from '@/lib/mock/data'
import { CARD, won, AVATAR_COLORS, BTN_PRIMARY } from '@/lib/dashboard-ui'
import { CUSTOMER_GRADE_LABEL, CUSTOMER_GRADE_STYLE } from '@/constants'
import type { CustomerGrade } from '@/types'

type Filter = 'ALL' | 'VIP' | 'REGULAR' | 'NEW' | 'ABSENT'

const CUTOFF = new Date()
CUTOFF.setDate(CUTOFF.getDate() - 30)

function isRegular(c: CustomerRow) {
  return c.grade === 'GOLD' || c.grade === 'VIP' || c.visit_count >= 10
}

function isNew(c: CustomerRow) {
  return c.visit_count <= 3
}

function isAbsent(c: CustomerRow) {
  if (!c.last_visit_at) return false
  return new Date(c.last_visit_at) < CUTOFF
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [memo, setMemo] = useState('')

  const apiGrade = filter === 'VIP' || filter === 'REGULAR' || filter === 'NEW' ? filter : undefined
  const { customers: apiCustomers, stats } = useCustomers(apiGrade)

  const filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: '전체' },
    { key: 'VIP', label: 'VIP' },
    { key: 'REGULAR', label: '단골' },
    { key: 'NEW', label: '신규' },
    { key: 'ABSENT', label: '장기 미방문' },
  ]

  const filtered = useMemo(() => apiCustomers.filter((c) => {
    if (filter === 'VIP' && c.grade !== 'VIP') return false
    if (filter === 'REGULAR' && !isRegular(c)) return false
    if (filter === 'NEW' && !isNew(c)) return false
    if (filter === 'ABSENT' && !isAbsent(c)) return false
    if (search && !c.name.includes(search) && !c.phone.includes(search) && !c.car_number.includes(search)) return false
    return true
  }), [apiCustomers, filter, search])

  function openPanel(c: CustomerRow) {
    setSelected(c)
    setMemo(c.memo)
  }

  const history = selected ? (mockCustomerVisitHistory[selected.user_id] ?? [
    { date: selected.last_visit_at, menu: '세차 서비스', amount: 35000 },
  ]) : []

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">고객 관리</h2>
        <span className="text-sm text-gray-400">총 {stats.total.toLocaleString()}명</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">전체 고객</p>
          <p className="text-lg font-semibold">{stats.total.toLocaleString()}명</p>
          <p className="text-[11px] text-green-600 mt-1">신규 {stats.new}명</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">단골</p>
          <p className="text-lg font-semibold">{stats.regular}명</p>
          <p className="text-[11px] text-gray-400 mt-1">{stats.regular_pct}%</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">VIP</p>
          <p className="text-lg font-semibold">{stats.vip}명</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 연락처, 차량번호"
          className="flex-1 text-sm outline-none bg-transparent"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs border ${
              filter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.key === 'ABSENT' && getLongTermAbsentCount() > 0 && ` (${getLongTermAbsentCount()})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((c, i) => (
          <button
            key={c.user_id}
            type="button"
            onClick={() => openPanel(c)}
            className={`${CARD} w-full text-left hover:border-blue-200 transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                {c.name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <Badge className={CUSTOMER_GRADE_STYLE[c.grade as CustomerGrade]}>
                    {CUSTOMER_GRADE_LABEL[c.grade as CustomerGrade]}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{c.car_model} · 방문 {c.visit_count}회 · 최근 {c.last_visit_at}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{won(c.total_spent)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold">고객 상세</h3>
              <button type="button" onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-500">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${AVATAR_COLORS[selected.user_id % AVATAR_COLORS.length]}`}>
                  {selected.name.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selected.name}</p>
                  <Badge className={CUSTOMER_GRADE_STYLE[selected.grade as CustomerGrade]}>
                    {CUSTOMER_GRADE_LABEL[selected.grade as CustomerGrade]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[12px] text-gray-400">방문 횟수</p>
                  <p className="font-semibold mt-1">{selected.visit_count}회</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[12px] text-gray-400">누적 금액</p>
                  <p className="font-semibold mt-1">{won(selected.total_spent)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[12px] text-gray-400">차종</p>
                  <p className="font-semibold mt-1 text-sm">{selected.car_model}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[12px] text-gray-400">최근 방문</p>
                  <p className="font-semibold mt-1 text-sm">{selected.last_visit_at}</p>
                </div>
              </div>

              <div>
                <p className="text-[12px] text-gray-400 font-medium mb-2">방문 이력</p>
                <div className="space-y-2">
                  {history.map((h, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-50">
                      <div>
                        <p className="text-gray-900">{h.menu}</p>
                        <p className="text-xs text-gray-400">{h.date}</p>
                      </div>
                      <span className="font-medium">{won(h.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] text-gray-400 font-medium mb-2">사장님 메모</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none"
                  placeholder="고객 메모를 입력하세요"
                />
                <button type="button" className={`${BTN_PRIMARY} w-full mt-2 py-2.5`}>메모 저장</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
