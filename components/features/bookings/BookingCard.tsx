'use client'
import { memo, useCallback } from 'react'
import Link from 'next/link'
import type { Booking, BookingStatus } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'
import { formatMoney } from '@/lib/utils'

interface BookingCardProps {
  booking: Booking
  onStatusChange?: (id: number, status: BookingStatus) => void
}

export const BookingCard = memo(function BookingCard({ booking, onStatusChange }: BookingCardProps) {
  const handleConfirm = useCallback(() => onStatusChange?.(booking.id, 'CONFIRMED'), [booking.id, onStatusChange])

  return (
    <div className="bg-white border border-gray-100 rounded-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <Link href={`/bookings/${booking.id}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600">
            {booking.user.name}
          </Link>
          <div className="text-xs text-gray-400 mt-0.5">{booking.booking_time} · {booking.vehicle.car_model}</div>
        </div>
        <Badge className={BOOKING_STATUS_STYLE[booking.status]}>
          {BOOKING_STATUS_LABEL[booking.status]}
        </Badge>
      </div>
      <div className="text-xs text-gray-500 mb-3">
        {booking.service_menu.name} · {formatMoney(booking.price)}
      </div>
      {booking.status === 'PENDING' && onStatusChange && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleConfirm}>확정</Button>
          <Link href={`/bookings/${booking.id}`}>
            <Button size="sm" variant="secondary">상세</Button>
          </Link>
        </div>
      )}
    </div>
  )
})
