'use client'
import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { mockApi } from '@/lib/mock/data'
import { SERVICE_TYPE_LABEL } from '@/constants'
import { formatMoney } from '@/lib/utils'
import type { ServiceTypeCode } from '@/types'
import { Plus } from 'lucide-react'

export default function MenusPage() {
  const { data: menus } = useSWR('menus', () => mockApi.getMenus())
  const [tab, setTab] = useState<ServiceTypeCode | 'ALL'>('ALL')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = menus?.filter((m) => tab === 'ALL' || m.service_type_code === tab) ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setTab('ALL')} className={`px-3 py-1 rounded-full text-xs border ${tab === 'ALL' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200'}`}>전체</button>
          {(['CAR_WASH', 'DETAILING', 'COATING'] as ServiceTypeCode[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-full text-xs border whitespace-nowrap ${tab === t ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200'}`}>
              {SERVICE_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}><Plus size={14} className="mr-1" />추가</Button>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <Card key={m.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link href={`/menus/${m.id}`} className="font-medium text-gray-900 hover:text-primary-600">{m.name}</Link>
                <div className="text-xs text-gray-400 mt-0.5">{m.duration_minutes}분 · {SERVICE_TYPE_LABEL[m.service_type_code]}</div>
              </div>
              <Badge className={m.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>
                {m.is_active ? '활성' : '비활성'}
              </Badge>
            </div>
            <div className="text-sm font-semibold">{formatMoney(m.base_price)}</div>
            {m.distance_pricing.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">거리별 요금 {m.distance_pricing.length}구간</div>
            )}
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="메뉴 추가">
        <div className="space-y-3">
          <Input placeholder="메뉴명" />
          <Input type="number" placeholder="기본 가격" />
          <Input type="number" placeholder="소요시간 (분)" />
          <Button className="w-full" onClick={() => setModalOpen(false)}>저장</Button>
        </div>
      </Modal>
    </div>
  )
}
