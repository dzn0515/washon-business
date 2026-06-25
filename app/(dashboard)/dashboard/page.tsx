'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { mockApi } from '@/lib/mock/data'
import { formatMoney } from '@/lib/utils'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function DashboardPage() {
  const { data: summary } = useSWR('dashboard-summary', () => mockApi.getDashboardSummary())
  const { data: bookings } = useSWR('today-bookings', () => mockApi.getBookings())
  const { data: weekly } = useSWR('weekly-stats', () => mockApi.getWeeklyStats())
  const { data: notifications } = useSWR('notifications', () => mockApi.getNotifications())

  const today = bookings?.filter((b) => b.booking_date === '2026-06-24').slice(0, 5) ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '오늘 예약', value: `${summary?.today_bookings ?? '-'}건` },
          { label: '이번달 매출', value: formatMoney(summary?.month_sales ?? 0) },
          { label: '미정산 금액', value: formatMoney(summary?.unsettled_amount ?? 0) },
          { label: '신규 고객', value: `${summary?.new_customers ?? '-'}명` },
        ].map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className="text-lg font-semibold">{s.value}</div>
          </Card>
        ))}
      </div>

      <Card title="오늘 예약">
        <div className="space-y-2">
          {today.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm font-medium">{b.booking_time} {b.user.name}</div>
                <div className="text-xs text-gray-400">{b.service_menu.name}</div>
              </div>
              <Badge className={BOOKING_STATUS_STYLE[b.status]}>{BOOKING_STATUS_LABEL[b.status]}</Badge>
            </div>
          ))}
        </div>
        <Link href="/bookings" className="flex items-center gap-1 text-xs text-primary-600 mt-3 font-medium">
          전체보기 <ChevronRight size={14} />
        </Link>
      </Card>

      <Card title="이번주 예약 현황">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly ?? []}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="최근 알림">
        <div className="space-y-2">
          {notifications?.slice(0, 3).map((n) => (
            <div key={n.id} className={`text-sm py-2 border-b border-gray-50 last:border-0 ${!n.is_read ? 'font-medium' : 'text-gray-500'}`}>
              <div>{n.title}</div>
              <div className="text-xs text-gray-400">{n.body}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
