'use client'
import Link from 'next/link'
import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import ReservationSubNav from '@/components/features/reservations/ReservationSubNav'
import BookingStatusBadge from '@/components/BookingStatusBadge'
import BookingStatusActions from '@/components/BookingStatusActions'
import { useReservations } from '@/lib/hooks/useReservations'
import {
  mockWeeklyRevenue,
  mockMonthlyReservationStats,
  mockMonthlyBookingTrend,
} from '@/lib/mock/data'
import { CARD, won } from '@/lib/dashboard-ui'
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '@/constants'
import type { BookingStatus, PaymentStatus } from '@/types'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

type Tab = 'today' | 'week' | 'month'

export default function ReservationsPage() {
  const [tab, setTab] = useState<Tab>('today')
  const {
    bookings,
    todayKpi,
    selectedDate,
    setSelectedDate,
    updateStatus,
    updatingId,
    loading,
    setBookings,
  } = useReservations()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: '오늘' },
    { key: 'week', label: '주간' },
    { key: 'month', label: '월간' },
  ]

  return (
    <div className="space-y-4">
      <ReservationSubNav />

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              tab === t.key ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="booking-date" className="text-sm text-gray-500 shrink-0">
              예약일
            </label>
            <input
              id="booking-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
            />
            {loading && <span className="text-xs text-gray-400">불러오는 중...</span>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">오늘 예약</p>
              <p className="text-lg font-semibold">{todayKpi.total}건</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">완료</p>
              <p className="text-lg font-semibold">{todayKpi.completed}건</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">대기</p>
              <p className="text-lg font-semibold">{todayKpi.pending}건</p>
            </div>
          </div>

          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={String(b.id)} className={CARD}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    <span className="text-blue-600 font-semibold text-sm shrink-0">{b.time}</span>
                    <div className="min-w-0">
                      <Link
                        href={`/bookings/${b.id}?date=${selectedDate}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {b.customer_name}
                      </Link>
                      <p className="text-xs text-gray-400 truncate">{b.service_name} · {b.car_model}</p>
                      {'vehicle' in b && b.vehicle ? (
                        <span className="text-sm text-gray-500">
                          🚗 {[b.vehicle.brand, b.vehicle.model].filter(Boolean).join(' ')}
                          {b.vehicle.license_plate ? ` · ${b.vehicle.license_plate}` : ''}
                        </span>
                      ) : null}
                      <p className="text-sm font-medium mt-1">{won(b.price)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {'payment_status' in b && b.payment_status ? (
                      <Badge className={PAYMENT_STATUS_STYLE[b.payment_status as PaymentStatus]}>
                        {PAYMENT_STATUS_LABEL[b.payment_status as PaymentStatus]}
                      </Badge>
                    ) : null}
                    <BookingStatusBadge status={b.status as BookingStatus} />
                    <BookingStatusActions
                      bookingId={String(b.id)}
                      status={b.status as BookingStatus}
                      disabled={updatingId === String(b.id)}
                      onStatusChange={(newStatus) => {
                        void updateStatus(b.id, newStatus)
                        setBookings((prev) =>
                          (prev ?? []).map((row) =>
                            row.id === b.id ? { ...row, status: newStatus } : row,
                          ),
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'week' && (
        <div className={CARD}>
          <p className="text-[12px] text-gray-400 font-medium mb-2">이번주 매출</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyRevenue}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v) => won(Number(v ?? 0))} />
                <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'month' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">이번달 예약</p>
              <p className="text-lg font-semibold">{mockMonthlyReservationStats.total}건</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">완료</p>
              <p className="text-lg font-semibold">{mockMonthlyReservationStats.completed}건</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">노쇼</p>
              <p className="text-lg font-semibold text-red-600">{mockMonthlyReservationStats.no_show}건</p>
            </div>
          </div>
          <div className={CARD}>
            <p className="text-[12px] text-gray-400 font-medium mb-2">월간 예약 추이</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockMonthlyBookingTrend}>
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
