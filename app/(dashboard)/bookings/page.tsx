'use client'
import { useMemo, useState } from 'react'
import { mockBookings, toBooking } from '@/lib/mock/data'
import { BookingCard } from '@/components/features/bookings/BookingCard'
import { BOOKING_STATUS_LABEL } from '@/constants'
import type { BookingStatus } from '@/types'

const TABS: (BookingStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW']

export default function BookingsPage() {
  const [tab, setTab] = useState<BookingStatus | 'ALL'>('ALL')

  const bookings = useMemo(() => {
    const list = mockBookings.map(toBooking)
    if (tab === 'ALL') return list
    return list.filter((b) => b.status === tab)
  }, [tab])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${
              tab === t ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-500'
            }`}
          >
            {t === 'ALL' ? '전체' : BOOKING_STATUS_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
        {bookings.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-12">예약이 없습니다</div>
        )}
      </div>
    </div>
  )
}
