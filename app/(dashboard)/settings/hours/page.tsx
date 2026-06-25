'use client'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { mockApi } from '@/lib/mock/data'
import Link from 'next/link'
import { SETTINGS_NAV } from '@/constants'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

function SettingsNav() {
  const pathname = usePathname()
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
      {SETTINGS_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs whitespace-nowrap border',
            pathname === item.href ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-500'
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export default function HoursSettingsPage() {
  const { data: hours } = useSWR('hours', () => mockApi.getHours())

  return (
    <div>
      <SettingsNav />
      <Card>
        <div className="divide-y divide-gray-50">
          {hours?.map((h) => (
            <div key={h.day} className="flex items-center gap-3 py-3">
              <span className="w-6 text-sm font-medium">{h.label}</span>
              {h.is_open ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" defaultValue={h.open_time} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
                  <span className="text-gray-400">~</span>
                  <input type="time" defaultValue={h.close_time} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
                </div>
              ) : (
                <span className="text-xs text-gray-400 flex-1">휴무</span>
              )}
              <input type="checkbox" defaultChecked={h.is_open} className="w-4 h-4" />
            </div>
          ))}
        </div>
        <Button className="w-full mt-4">저장하기</Button>
      </Card>
    </div>
  )
}
