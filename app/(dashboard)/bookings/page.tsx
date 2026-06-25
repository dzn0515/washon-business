'use client'
import { useState, useCallback } from 'react'
import { useBookings } from '@/hooks/useBookings'
import { BookingCard } from '@/components/features/bookings/BookingCard'
import type { BookingStatus } from '@/types'
import { cn } from '@/lib/utils'

const TABS: (BookingStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const TAB_LABEL: Record<string, string> = {
  ALL: '전체', PENDING: '대기', CONFIRMED: '확정', COMPLETED: '완료', CANCELLED: '취소', NO_SHOW: '노쇼',
}

export default function BookingsPage() {
  const [tab, setTab] = useState<BookingStatus | 'ALL'>('ALL')
  const { data: bookings, mutate } = useBookings({ status: tab })

  const handleStatusChange = useCallback(() => {
    mutate()
  }, [mutate])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs whitespace-nowrap border',
              tab === t ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {bookings?.map((b) => (
          <BookingCard key={b.id} booking={b} onStatusChange={handleStatusChange} />
        ))}
      </div>
    </div>
  )
}
