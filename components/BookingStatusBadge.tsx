'use client'

import { BOOKING_STATUS_MAP, type BookingStatus } from '@/types'

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS_MAP[status] ?? { label: status, color: '#6B7280', bg: '#F3F4F6' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  )
}
