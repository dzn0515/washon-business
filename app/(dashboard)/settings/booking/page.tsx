'use client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Link from 'next/link'
import { SETTINGS_NAV } from '@/constants'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

function SettingsNav() {
  const pathname = usePathname()
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
      {SETTINGS_NAV.map((item) => (
        <Link key={item.href} href={item.href} className={cn('px-3 py-1.5 rounded-full text-xs whitespace-nowrap border', pathname === item.href ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-500')}>
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export default function BookingSettingsPage() {
  return (
    <div>
      <SettingsNav />
      <Card title="예약 설정">
        <div className="space-y-4 text-sm">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">예약 모드</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-xl">
              <option value="AUTO">자동 확정</option>
              <option value="MANUAL">수동 확정</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">예약 슬롯 간격</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-xl">
              <option>30분</option>
              <option>60분</option>
              <option>90분</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">동시 예약 수</label>
            <Input type="number" defaultValue={3} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">예약 가능 기간</label>
            <Input type="number" defaultValue={30} placeholder="일" />
          </div>
        </div>
        <Button className="w-full mt-4">저장하기</Button>
      </Card>
    </div>
  )
}
