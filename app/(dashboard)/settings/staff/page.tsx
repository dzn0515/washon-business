'use client'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { mockApi } from '@/lib/mock/data'
import Link from 'next/link'
import { SETTINGS_NAV } from '@/constants'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

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

export default function StaffSettingsPage() {
  const { data: staff } = useSWR('staff', () => mockApi.getStaff())

  return (
    <div>
      <SettingsNav />
      <Card title="베이 수">
        <Input type="number" defaultValue={3} className="mb-4" />
      </Card>
      <Card title="직원 관리">
        <div className="space-y-2 mb-4">
          {staff?.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm font-medium">{s.name}</span>
              <Badge className={s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>
                {s.is_active ? '활성' : '비활성'}
              </Badge>
            </div>
          ))}
        </div>
        <Button size="sm" variant="secondary"><Plus size={14} className="mr-1" />직원 추가</Button>
      </Card>
      <Button className="w-full mt-4">저장하기</Button>
    </div>
  )
}
