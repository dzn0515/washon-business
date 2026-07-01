'use client'

import BayCalendarGrid from '@/components/features/reservations/BayCalendarGrid'
import ReservationSubNav from '@/components/features/reservations/ReservationSubNav'
import { useBayCalendar } from '@/lib/hooks/useBayCalendar'

export default function BayCalendarPage() {
  const { bays, bookings, selectedDate, setSelectedDate, loading, isLive } = useBayCalendar()

  return (
    <div className="space-y-4">
      <ReservationSubNav />

      <div className="flex items-center gap-3 flex-wrap">
        <label htmlFor="calendar-date" className="text-sm text-gray-500 shrink-0">
          예약일
        </label>
        <input
          id="calendar-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
        />
        {loading && <span className="text-xs text-gray-400">불러오는 중...</span>}
        {!loading && !isLive && (
          <span className="text-xs text-amber-600">데모 데이터 표시 중</span>
        )}
      </div>

      <BayCalendarGrid bays={bays} bookings={bookings} selectedDate={selectedDate} />
    </div>
  )
}
