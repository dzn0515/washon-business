'use client'

import Link from 'next/link'
import BookingStatusBadge from '@/components/BookingStatusBadge'
import type { UpcomingItem } from '@/lib/hooks/useUpcomingBookings'
import { isPaymentPending } from '@/lib/booking-schedule'

type Props = {
  item: UpcomingItem
  href: (path: string) => string
}

export default function UpcomingBookingCard({ item, href }: Props) {
  const pending = isPaymentPending(item.status, item.payment_status, item.payment_method)
  const onsite = (item.payment_method ?? '').toLowerCase() === 'onsite'
  const detailHref = href(`/bookings/${item.id}?date=${item.booking_date}`)

  return (
    <Link
      href={detailHref}
      className={`block rounded-xl border p-3 transition hover:shadow-sm ${
        item.imminent
          ? 'border-orange-300 bg-orange-50'
          : pending
            ? 'border-amber-200 bg-amber-50/60'
            : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {item.relative} · {item.start_time}
          </p>
          <p className="mt-0.5 text-sm text-gray-700 truncate">{item.customer_name}</p>
          <p className="mt-0.5 text-xs text-gray-500 truncate">
            {item.car_number || '-'} · {item.service_name}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {item.bay_name ? item.bay_name : '베이 -'} · {item.price.toLocaleString()}원
          </p>
        </div>
        <div className="shrink-0 text-right space-y-1">
          {item.imminentText ? (
            <span className="inline-block rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              {item.imminentText}
            </span>
          ) : null}
          {onsite ? (
            <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              현장결제
            </span>
          ) : null}
          {pending ? (
            <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              결제대기
            </span>
          ) : (
            <BookingStatusBadge status={item.status} />
          )}
        </div>
      </div>
    </Link>
  )
}