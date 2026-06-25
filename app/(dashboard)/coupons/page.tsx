'use client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { mockCoupons } from '@/lib/mock/data'
import { formatMoney } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default function CouponsPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm"><Plus size={14} className="mr-1" />쿠폰 발행</Button>
      </div>

      <div className="space-y-2">
        {mockCoupons.map((c) => (
          <Card key={c.id}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <Badge className={c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{c.is_active ? '활성' : '비활성'}</Badge>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {c.discount_type === 'FIXED' ? formatMoney(c.discount_value) : `${c.discount_value}%`} 할인 · 최소 {formatMoney(c.min_price)}
                </div>
                <div className="text-xs text-gray-400">{c.valid_from} ~ {c.valid_until}</div>
              </div>
              <div className="text-right text-sm">
                <div>발행 {c.issue_count} / 사용 {c.use_count}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
