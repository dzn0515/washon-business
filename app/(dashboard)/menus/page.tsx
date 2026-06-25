'use client'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { mockMenus } from '@/lib/mock/data'
import { formatMoney } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default function MenusPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm"><Plus size={14} className="mr-1" />메뉴 추가</Button>
      </div>

      <div className="space-y-2">
        {mockMenus.map((m) => (
          <Link key={m.id} href={`/menus/${m.id}`}>
            <Card className="hover:border-primary-200 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.name}</span>
                    <Badge className={m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{m.is_active ? '활성' : '비활성'}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.service_type_name} · {m.duration_minutes}분</div>
                </div>
                <div className="text-sm font-medium">{formatMoney(m.base_price)}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
