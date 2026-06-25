'use client'
import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { useReservations } from '@/lib/hooks/useReservations'
import {
  mockWeeklyRevenue,
  mockMonthlyReservationStats,
  mockMonthlyBookingTrend,
} from '@/lib/mock/data'
import { CARD, won } from '@/lib/dashboard-ui'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'
import type { BookingStatus } from '@/types'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

type Tab = 'today' | 'week' | 'month'

function StatusActions({ status }: { status: string }) {
  if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW') {
    return <span className="text-xs text-gray-400">처리 완료</span>
  }
  return (
    <div className="flex gap-1.5 flex-wrap justify-end">
      {(status === 'PENDING' || status === 'CONFIRMED') && (
        <button type="button" className="text-xs px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-200">
          예약확정
        </button>
      )}
      {(status === 'CONFIRMED' || status === 'IN_PROGRESS') && (
        <button type="button" className="text-xs px-2.5 py-1 rounded-lg border bg-green-50 text-green-700 border-green-200">
          완료처리
        </button>
      )}
      {status !== 'COMPLETED' && status !== 'CANCELLED' && (
        <button type="button" className="text-xs px-2.5 py-1 rounded-lg border bg-red-50 text-red-700 border-red-200">
          취소
        </button>
      )}
    </div>
  )
}

export default function ReservationsPage() {
  const [tab, setTab] = useState<Tab>('today')
  const { bookings, todayKpi } = useReservations()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: '오늘' },
    { key: 'week', label: '주간' },
    { key: 'month', label: '월간' },
  ]

  return (
    <div className="space-y-4">
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
              <div key={b.id} className={CARD}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    <span className="text-blue-600 font-semibold text-sm shrink-0">{b.time}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{b.customer_name}</p>
                      <p className="text-xs text-gray-400 truncate">{b.service_name} · {b.car_model}</p>
                      <p className="text-sm font-medium mt-1">{won(b.price)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className={BOOKING_STATUS_STYLE[b.status as BookingStatus]}>
                      {BOOKING_STATUS_LABEL[b.status as BookingStatus]}
                    </Badge>
                    <StatusActions status={b.status} />
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
