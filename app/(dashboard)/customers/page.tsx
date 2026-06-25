'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useCustomers } from '@/hooks/useCustomers'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { CUSTOMER_GRADE_LABEL, CUSTOMER_GRADE_STYLE } from '@/constants'
import { formatMoney } from '@/lib/utils'
import { Search, AlertTriangle } from 'lucide-react'
import type { CustomerGrade } from '@/types'

export default function CustomersPage() {
  const { data: customers } = useCustomers()
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState<CustomerGrade | 'ALL'>('ALL')

  const filtered = customers?.filter((c) => {
    if (grade !== 'ALL' && c.grade !== grade) return false
    if (search && !c.name.includes(search) && !c.phone.includes(search)) return false
    return true
  }) ?? []

  const longTerm = customers?.filter((c) => c.memo.includes('장기')).length ?? 0

  return (
    <div className="space-y-4">
      {longTerm > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-card px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          <AlertTriangle size={16} />
          장기 미방문 고객 {longTerm}명 — 재방문 쿠폰을 발송해보세요
        </div>
      )}

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
        <Search size={15} className="text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 연락처, 차량번호" className="flex-1 text-sm outline-none bg-transparent" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'NORMAL', 'SILVER', 'GOLD', 'VIP'] as const).map((g) => (
          <button key={g} onClick={() => setGrade(g)} className={`px-3 py-1 rounded-full text-xs border ${grade === g ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-500'}`}>
            {g === 'ALL' ? '전체' : CUSTOMER_GRADE_LABEL[g]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <Link key={c.user_id} href={`/customers/${c.user_id}`}>
            <Card className="hover:border-primary-200 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <Badge className={CUSTOMER_GRADE_STYLE[c.grade]}>{CUSTOMER_GRADE_LABEL[c.grade]}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.vehicles[0]?.car_model} · 방문 {c.visit_count}회</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{formatMoney(c.total_spent)}</div>
                  <div className="text-xs text-gray-400">최근 {c.last_visit_at}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
