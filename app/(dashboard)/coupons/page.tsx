'use client'
import { useState } from 'react'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { mockApi } from '@/lib/mock/data'
import { formatMoney } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default function CouponsPage() {
  const { data: coupons } = useSWR('coupons', () => mockApi.getCoupons())
  const [modalOpen, setModalOpen] = useState(false)

  const active = coupons?.filter((c) => c.is_active) ?? []
  const inactive = coupons?.filter((c) => !c.is_active) ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}><Plus size={14} className="mr-1" />쿠폰 만들기</Button>
      </div>

      <Card title="진행 중">
        <div className="space-y-3">
          {active.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-xl p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{c.name}</span>
                <Badge className="bg-green-100 text-green-800">진행중</Badge>
              </div>
              <div className="text-xs text-gray-400">
                {c.discount_type === 'FIXED' ? formatMoney(c.discount_value) : `${c.discount_value}%`} 할인 ·
                발급 {c.issue_count} / 사용 {c.use_count}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">{c.valid_from} ~ {c.valid_until}</div>
            </div>
          ))}
        </div>
      </Card>

      {inactive.length > 0 && (
        <Card title="종료">
          {inactive.map((c) => (
            <div key={c.id} className="text-sm text-gray-400 py-2">{c.name}</div>
          ))}
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="쿠폰 만들기" size="lg">
        <div className="space-y-3">
          <Input placeholder="쿠폰명" />
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
              <option value="FIXED">정액 할인</option>
              <option value="PERCENT">정률 할인</option>
            </select>
            <Input type="number" placeholder="할인값" />
          </div>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
            <option>전체 고객</option>
            <option>VIP 등급</option>
            <option>특정 고객</option>
          </select>
          <Button className="w-full" onClick={() => setModalOpen(false)}>생성</Button>
        </div>
      </Modal>
    </div>
  )
}
