'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  mockDashboard,
  mockTodayBookings,
  mockWeeklyChart,
  mockNotifications,
} from '@/lib/mock/data'
import { formatMoney } from '@/lib/utils'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { BookingStatus } from '@/types'

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <div className="text-xs text-gray-400 mb-1">오늘 예약</div>
          <div className="text-lg font-semibold">{mockDashboard.today_bookings}건</div>
          <div className="text-[11px] text-green-600 mt-0.5">↑ 어제 대비 +{mockDashboard.today_bookings_diff}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">이번달 매출</div>
          <div className="text-lg font-semibold">{formatMoney(mockDashboard.monthly_revenue)}</div>
          <div className="text-[11px] text-green-600 mt-0.5">↑ 전월 대비 {mockDashboard.monthly_revenue_diff}%</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">미정산 금액</div>
          <div className="text-lg font-semibold">{formatMoney(mockDashboard.unsettled_amount)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{mockDashboard.unsettled_date}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">신규 고객</div>
          <div className="text-lg font-semibold">{mockDashboard.new_customers}명</div>
          <div className="text-[11px] text-green-600 mt-0.5">↑ 이번달 +{mockDashboard.new_customers_diff}</div>
        </Card>
      </div>

      <Card title="오늘 예약">
        <div className="space-y-2">
          {mockTodayBookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm font-medium">{b.time} {b.customer_name}</div>
                <div className="text-xs text-gray-400">{b.service_name}</div>
              </div>
              <Badge className={BOOKING_STATUS_STYLE[b.status as BookingStatus]}>
                {BOOKING_STATUS_LABEL[b.status as BookingStatus]}
              </Badge>
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
            <BarChart data={mockWeeklyChart}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="최근 알림">
        <div className="space-y-2">
          {mockNotifications.map((n) => (
            <div key={n.id} className="text-sm py-2 border-b border-gray-50 last:border-0">
              <div>{n.message}</div>
              <div className="text-xs text-gray-400">{n.time}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
