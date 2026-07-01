'use client'
import Link from 'next/link'
import { ChevronRight, RefreshCw } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useDashboardToday, type DashboardTodayBooking } from '@/lib/hooks/useDashboardToday'
import { formatDateLabel } from '@/lib/api-mappers'
import { CARD, won } from '@/lib/dashboard-ui'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'

function BookingRow({
  booking,
  date,
}: {
  booking: DashboardTodayBooking
  date: string
}) {
  return (
    <Link
      href={`/bookings/${booking.id}?date=${date}`}
      className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{booking.customer_name}</p>
        <p className="text-xs text-gray-400 truncate">
          {booking.start_time}–{booking.end_time} · {booking.service_name}
          {booking.bay_name ? ` · ${booking.bay_name}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge className={BOOKING_STATUS_STYLE[booking.status]}>
          {BOOKING_STATUS_LABEL[booking.status]}
        </Badge>
        <span className="text-xs text-gray-500">{won(booking.price)}</span>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { today, loading, isLive, refetch, todayDate } = useDashboardToday()
  const sc = today.status_counts

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">오늘 운영 현황</h2>
          <span className="text-sm text-gray-400">{formatDateLabel()}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isLive && !loading ? (
            <span className="text-xs text-amber-600">데모 데이터</span>
          ) : null}
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">오늘 예약</p>
          <p className="text-xl font-semibold text-gray-900">{today.total_bookings}건</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">예상 매출</p>
          <p className="text-xl font-semibold text-gray-900">{won(today.expected_revenue)}</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">사용 중 베이</p>
          <p className="text-xl font-semibold text-gray-900">
            {today.bay_summary.busy_now}
            <span className="text-sm font-normal text-gray-400"> / {today.bay_summary.active}</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">가용 {today.bay_summary.available_now}개</p>
        </div>
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">대기/확정/진행/완료</p>
          <p className="text-sm font-semibold text-gray-900">
            {sc.pending}/{sc.confirmed}/{sc.in_progress}/{sc.completed}
          </p>
          {sc.cancelled + sc.noshow > 0 ? (
            <p className="text-[11px] text-gray-400 mt-1">취소 {sc.cancelled} · 노쇼 {sc.noshow}</p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/dashboard/reservations/calendar"
          className="text-sm text-blue-600 font-medium flex items-center gap-0.5"
        >
          베이 캘린더 보기 <ChevronRight size={14} />
        </Link>
      </div>

      <div className={CARD}>
        <p className="text-[12px] text-gray-400 font-medium mb-2">지금 진행 중</p>
        {today.current_bookings.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">현재 진행 중인 예약이 없습니다.</p>
        ) : (
          today.current_bookings.map((b) => (
            <BookingRow key={b.id} booking={b} date={todayDate} />
          ))
        )}
      </div>

      <div className={CARD}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] text-gray-400 font-medium">다음 예약</p>
          <Link href="/dashboard/reservations" className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>
        {today.next_bookings.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">남은 예약이 없습니다.</p>
        ) : (
          today.next_bookings.map((b) => (
            <BookingRow key={b.id} booking={b} date={todayDate} />
          ))
        )}
      </div>

      <div className={CARD}>
        <p className="text-[12px] text-gray-400 font-medium mb-3">직원별 배정 현황</p>
        <div className="space-y-2">
          {today.staff_summary.map((s) => (
            <div key={s.staff_id ?? 'unassigned'} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-1 h-6 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className={`text-sm truncate ${!s.active && s.staff_id ? 'text-gray-400' : 'text-gray-900'}`}>
                  {s.name}
                  {!s.active && s.staff_id ? ' (비활성)' : ''}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 shrink-0">{s.assigned_count}건</span>
            </div>
          ))}
          {today.staff_summary.length === 0 ? (
            <p className="text-sm text-gray-400">등록된 직원이 없습니다.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
