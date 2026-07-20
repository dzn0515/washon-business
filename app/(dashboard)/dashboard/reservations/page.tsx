'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import Badge from '@/components/ui/Badge'
import ReservationSubNav from '@/components/features/reservations/ReservationSubNav'
import ReservationCreateModals from '@/components/features/reservations/ReservationCreateModals'
import ReservationMonthCalendar from '@/components/features/reservations/ReservationMonthCalendar'
import BookingStatusBadge from '@/components/BookingStatusBadge'
import BookingStatusActions from '@/components/features/bookings/BookingStatusActions'
import { useReservations } from '@/lib/hooks/useReservations'
import { CARD, won } from '@/lib/dashboard-ui'
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '@/constants'
import { RESERVATION_SOURCE_LABEL, RESERVATION_SOURCE_STYLE } from '@/lib/reservation-ui'
import { isPaymentPending, relativeBookingLabel, type ScheduleFilter } from '@/lib/booking-schedule'
import type { BookingStatus, PaymentStatus } from '@/types'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

const FILTERS: { key: ScheduleFilter; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'tomorrow', label: '내일' },
  { key: 'next7', label: '이번 주(7일)' },
  { key: 'upcoming', label: '전체 예정' },
  { key: 'date', label: '날짜 선택' },
  { key: 'calendar', label: '달력' },
  { key: 'past', label: '지난 예약' },
]

function ReservationsPageInner() {
  const {
    bookings,
    summary,
    nextHint,
    emptyMessage,
    filter,
    setFilter,
    selectedDate,
    setSelectedDate,
    calendarMonth,
    setCalendarMonth,
    calendarCounts,
    updateStatus,
    updatingId,
    loading,
    setBookings,
    refetch,
    isLive,
  } = useReservations()
  const { isDemo } = useDemoMode()

  return (
    <div className="space-y-4">
      <ReservationSubNav />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key, selectedDate)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border ${
              filter === t.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          { label: '오늘 예약', value: summary.today },
          { label: '내일 예약', value: summary.tomorrow },
          { label: '이번 주 예정', value: summary.next7 },
          { label: '결제대기', value: summary.paymentPending },
        ].map((c) => (
          <div key={c.label} className={`${CARD} py-3`}>
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className="text-lg font-semibold text-gray-900">{c.value}건</p>
          </div>
        ))}
      </div>

      {filter === 'next7' ? (
        <p className="text-xs text-gray-400">오늘부터 향후 7일(오늘 포함) 예약을 표시합니다.</p>
      ) : null}

      {(filter === 'date' || filter === 'today' || filter === 'tomorrow') && (
        <div className="flex items-center gap-2">
          <label htmlFor="booking-date" className="text-sm text-gray-500 shrink-0">
            예약일
          </label>
          <input
            id="booking-date"
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              setFilter('date', v)
              setSelectedDate(v)
            }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      )}

      <ReservationCreateModals
        selectedDate={selectedDate}
        isDemo={isDemo}
        onSaved={() => void refetch()}
        onDemoAdd={(row) => setBookings((prev) => [...(prev ?? []), row])}
      />

      <div className={`grid gap-4 ${filter === 'calendar' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {filter === 'calendar' ? (
          <ReservationMonthCalendar
            month={calendarMonth}
            selectedDate={selectedDate}
            counts={calendarCounts}
            onSelectDate={(iso) => {
              setFilter('calendar', iso)
              setSelectedDate(iso)
            }}
            onMonthChange={setCalendarMonth}
          />
        ) : null}

        <div className="space-y-2">
          {loading ? (
            <div className={`${CARD} text-sm text-gray-400`}>불러오는 중…</div>
          ) : bookings.length === 0 ? (
            <div className={`${CARD} py-8 text-center`}>
              <p className="text-sm text-gray-700">{emptyMessage}</p>
              {nextHint ? <p className="mt-2 text-xs text-blue-600">{nextHint}</p> : null}
            </div>
          ) : (
            bookings.map((b) => {
              const pending = isPaymentPending(b.status, b.payment_status)
              const dateLabel = b.booking_date
                ? relativeBookingLabel(b.booking_date)
                : selectedDate
              return (
                <div
                  key={String(b.id)}
                  className={`${CARD} ${b.source === 'block' ? 'border-gray-200 bg-gray-50' : ''} ${
                    pending ? 'border-amber-200 bg-amber-50/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <div className="shrink-0 text-right w-[4.5rem]">
                        <p className="text-xs text-gray-400">{dateLabel}</p>
                        <p className="text-blue-600 font-semibold text-sm">
                          {b.time}
                          {b.end_time ? `~${b.end_time}` : ''}
                        </p>
                      </div>
                      <div className="min-w-0">
                        {b.source === 'block' ? (
                          <p className="font-medium text-gray-900">{b.customer_name}</p>
                        ) : (
                          <Link
                            href={`/bookings/${b.id}?date=${b.booking_date ?? selectedDate}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {b.customer_name}
                          </Link>
                        )}
                        <p className="text-xs text-gray-400 truncate">
                          {b.service_name}
                          {b.car_model ? ` · ${b.car_model}` : ''}
                          {b.car_number ? ` · ${b.car_number}` : ''}
                          {b.bay_name ? ` · ${b.bay_name}` : ''}
                        </p>
                        {b.customer_phone ? (
                          <p className="text-xs text-gray-400 mt-0.5">{b.customer_phone}</p>
                        ) : null}
                        <p className="text-sm font-medium mt-1">
                          {b.source === 'block' ? '—' : won(b.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className={RESERVATION_SOURCE_STYLE[b.source]}>
                        {RESERVATION_SOURCE_LABEL[b.source]}
                      </Badge>
                      {b.source !== 'block' && b.payment_status ? (
                        <Badge className={PAYMENT_STATUS_STYLE[b.payment_status as PaymentStatus]}>
                          {pending
                            ? '결제대기'
                            : PAYMENT_STATUS_LABEL[b.payment_status as PaymentStatus]}
                        </Badge>
                      ) : null}
                      {b.source !== 'block' ? (
                        <>
                          <BookingStatusBadge status={b.status as BookingStatus} />
                          <BookingStatusActions
                            status={b.status as BookingStatus}
                            disabled={isDemo || !isLive || updatingId === String(b.id)}
                            onAction={(newStatus) => {
                              void updateStatus(b.id, newStatus)
                            }}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400 p-4">예약 불러오는 중…</div>}>
      <ReservationsPageInner />
    </Suspense>
  )
}
