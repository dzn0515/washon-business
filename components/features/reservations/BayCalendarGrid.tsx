'use client'

import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import {
  bookingBlockStyle,
  generateTimeSlots,
  groupBookingsByBay,
  ROW_HEIGHT_PX,
  type CalendarBooking,
} from '@/lib/calendar-utils'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '@/constants'
import { cn } from '@/lib/utils'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import { resolveResourceLabel } from '@/lib/resource-label'
import type { BookingStatus, BusinessBay } from '@/types'

type Props = {
  bays: BusinessBay[]
  bookings: CalendarBooking[]
  selectedDate: string
}

function BookingCard({
  booking,
  selectedDate,
}: {
  booking: CalendarBooking
  selectedDate: string
}) {
  const { top, height } = bookingBlockStyle(booking.start_time, booking.end_time)
  const isTerminal = booking.status === 'cancelled' || booking.status === 'noshow'

  return (
    <Link
      href={`/bookings/${booking.id}?date=${selectedDate}`}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-lg border px-2 py-1 text-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow z-10 border-l-4',
        isTerminal ? 'opacity-60 border-dashed' : 'border-solid',
        booking.status === 'pending' && 'bg-yellow-50 border-yellow-200',
        booking.status === 'waiting' && 'bg-amber-50 border-amber-200',
        booking.status === 'confirmed' && 'bg-blue-50 border-blue-200',
        booking.status === 'arrived' && 'bg-purple-50 border-purple-200',
        booking.status === 'in_progress' && 'bg-emerald-50 border-emerald-300',
        booking.status === 'completed' && 'bg-gray-50 border-gray-200',
        booking.status === 'paid' && 'bg-green-50 border-green-200',
        booking.status === 'cancelled' && 'bg-red-50 border-red-200',
        booking.status === 'noshow' && 'bg-red-100 border-red-300',
      )}
      style={{
        top,
        height: height - 2,
        borderLeftColor: booking.staff_color ?? '#E5E7EB',
      }}
    >
      <p className={cn('font-medium text-gray-900 truncate', isTerminal && 'line-through')}>
        {booking.customer_name}
      </p>
      <p className="text-[10px] text-gray-500 truncate">{booking.service_name}</p>
      {booking.car_model && (
        <p className="text-[10px] text-gray-400 truncate">{booking.car_model}</p>
      )}
      <div className="flex items-center justify-between gap-1 mt-0.5 flex-wrap">
        <span className="text-[10px] text-gray-500">
          {booking.start_time}–{booking.end_time}
        </span>
        <div className="flex gap-0.5">
          {booking.payment_status ? (
            <Badge className={cn('text-[9px] px-1 py-0', PAYMENT_STATUS_STYLE[booking.payment_status])}>
              {PAYMENT_STATUS_LABEL[booking.payment_status]}
            </Badge>
          ) : null}
          <Badge className={cn('text-[9px] px-1 py-0', BOOKING_STATUS_STYLE[booking.status])}>
            {BOOKING_STATUS_LABEL[booking.status as BookingStatus]}
          </Badge>
        </div>
      </div>
      {booking.staff_name ? (
        <p className="text-[10px] text-gray-600 truncate mt-0.5 font-medium">{booking.staff_name}</p>
      ) : null}
    </Link>
  )
}

export default function BayCalendarGrid({ bays, bookings, selectedDate }: Props) {
  const { display: businessDisplay } = useBusinessMe()
  const resourceLabel = resolveResourceLabel(businessDisplay?.bizType)
  const timeSlots = generateTimeSlots()
  const sortedBays = [...bays].sort((a, b) => a.sort_order - b.sort_order)
  const byBay = groupBookingsByBay(bookings, sortedBays)
  const gridHeight = timeSlots.length * ROW_HEIGHT_PX

  if (sortedBays.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-400">
        등록된 {resourceLabel}가 없습니다. 운영관리에서 {resourceLabel}를 추가해 주세요.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="min-w-[640px] bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50">
          <div className="w-14 shrink-0" />
          {sortedBays.map((bay) => (
            <div
              key={bay.id}
              className={cn(
                'flex-1 min-w-[140px] border-l border-gray-100 px-2 py-2 text-center text-sm font-medium',
                !bay.is_active && 'opacity-40 text-gray-400',
              )}
            >
              {bay.name}
              {!bay.is_active && (
                <span className="block text-[10px] font-normal text-gray-400">비활성</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex">
          <div className="w-14 shrink-0 border-r border-gray-100">
            {timeSlots.map((slot) => (
              <div
                key={slot}
                className="text-[11px] text-gray-400 text-right pr-1 border-b border-gray-50 flex items-start justify-end pt-0.5"
                style={{ height: ROW_HEIGHT_PX }}
              >
                {slot}
              </div>
            ))}
          </div>

          {sortedBays.map((bay) => (
            <div
              key={bay.id}
              className={cn(
                'relative flex-1 min-w-[140px] border-l border-gray-100',
                !bay.is_active && 'bg-gray-50/70',
              )}
              style={{ height: gridHeight }}
            >
              {timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="border-b border-gray-50"
                  style={{ height: ROW_HEIGHT_PX }}
                />
              ))}
              {(byBay.get(bay.id) ?? []).map((booking) => (
                <BookingCard
                  key={String(booking.id)}
                  booking={booking}
                  selectedDate={selectedDate}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
