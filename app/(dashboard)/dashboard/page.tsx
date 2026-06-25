'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { formatDateLabel } from '@/lib/api-mappers'
import { CARD, won } from '@/lib/dashboard-ui'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'
import type { BookingStatus } from '@/types'

export default function DashboardPage() {
  const { dashboard, todayBookings } = useDashboard()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">대시보드</h2>
        <span className="text-sm text-gray-400">{formatDateLabel()}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">오늘 매출</p>
          <p className="text-xl font-semibold text-gray-900">{won(dashboard.today_revenue)}</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">오늘 예약</p>
          <p className="text-xl font-semibold text-gray-900">{dashboard.today_bookings}건</p>
          {dashboard.today_bookings_diff > 0 && (
            <p className="text-[11px] text-green-600 mt-1">대기 {dashboard.today_bookings_diff}건</p>
          )}
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">이번달 매출</p>
          <p className="text-xl font-semibold text-gray-900">{won(dashboard.monthly_revenue)}</p>
          <p className="text-[11px] text-green-600 mt-1">↑ 전월 대비 {dashboard.monthly_revenue_diff}%</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">앱 노출 수</p>
          <p className="text-xl font-semibold text-gray-900">{dashboard.app_exposure.toLocaleString()}회</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">☁️🌧️</span>
          <div>
            <p className="font-bold text-gray-900">오늘 오후 비 예보</p>
            <p className="text-sm text-gray-600 mt-0.5">우천 휴무를 등록하면 예약 고객에게 자동 알림톡이 발송돼요</p>
          </div>
        </div>
        <Link href="/dashboard/menus" className="text-sm text-blue-600 font-medium whitespace-nowrap flex items-center gap-0.5 shrink-0">
          바로 등록 <ChevronRight size={14} />
        </Link>
      </div>

      <div className={CARD}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] text-gray-400 font-medium">오늘 예약</p>
          <Link href="/dashboard/reservations" className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[12px] text-gray-400 border-b border-gray-50">
                <th className="pb-2 font-medium">시간</th>
                <th className="pb-2 font-medium">고객</th>
                <th className="pb-2 font-medium">메뉴</th>
                <th className="pb-2 font-medium text-right">금액</th>
                <th className="pb-2 font-medium text-right">상태</th>
              </tr>
            </thead>
            <tbody>
              {todayBookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 text-blue-600 font-medium">{b.time}</td>
                  <td className="py-2.5 text-gray-900">{b.customer_name}</td>
                  <td className="py-2.5 text-gray-500">{b.service_name}</td>
                  <td className="py-2.5 text-right text-gray-900">{won(b.price)}</td>
                  <td className="py-2.5 text-right">
                    <Badge className={BOOKING_STATUS_STYLE[b.status as BookingStatus]}>
                      {BOOKING_STATUS_LABEL[b.status as BookingStatus]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
