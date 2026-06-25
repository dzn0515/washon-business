'use client'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { mockApi } from '@/lib/mock/data'
import Link from 'next/link'
import { SETTINGS_NAV } from '@/constants'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { Trash2 } from 'lucide-react'

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

export default function HolidaysSettingsPage() {
  const { data: holidays } = useSWR('holidays', () => mockApi.getHolidays())

  return (
    <div>
      <SettingsNav />
      <Card title="휴무일 추가">
        <div className="flex gap-2 mb-4">
          <Input type="date" className="flex-1" />
          <Input placeholder="사유" className="flex-1" />
          <Button size="sm">추가</Button>
        </div>
        <div className="space-y-2">
          {holidays?.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <div className="text-sm font-medium">{h.date}</div>
                <div className="text-xs text-gray-400">{h.reason}</div>
              </div>
              <button className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
