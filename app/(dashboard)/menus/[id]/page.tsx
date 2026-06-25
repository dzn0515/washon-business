'use client'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { mockApi } from '@/lib/mock/data'

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: menus } = useSWR('menus', () => mockApi.getMenus())
  const menu = menus?.find((m) => m.id === Number(id))

  if (!menu) return <div className="text-sm text-gray-400">로딩 중...</div>

  return (
    <div className="space-y-4">
      <Card title="메뉴 정보">
        <Input defaultValue={menu.name} className="mb-2" />
        <Input defaultValue={menu.description} className="mb-2" />
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" defaultValue={menu.base_price} />
          <Input type="number" defaultValue={menu.duration_minutes} />
        </div>
      </Card>

      <Card title="거리별 요금제">
        {menu.distance_pricing.map((d) => (
          <div key={d.id} className="flex gap-2 items-center mb-2 text-sm">
            <Input defaultValue={d.distance_label} className="flex-1" />
            <Input type="number" defaultValue={d.price ?? 0} className="w-24" />
          </div>
        ))}
        <Button size="sm" variant="secondary">구간 추가</Button>
      </Card>

      <Button className="w-full">저장하기</Button>
    </div>
  )
}
