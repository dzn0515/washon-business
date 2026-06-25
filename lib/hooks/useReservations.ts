'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mapBookingStatus, todayIso } from '@/lib/api-mappers'
import { mockTodayBookings } from '@/lib/mock/data'

type ApiBooking = {
  id: string
  menu_id: string
  booking_date: string
  start_time: string
  price: number
  status: string
  customer_name: string
  vehicle_model: string | null
}

type ApiMenu = {
  id: string
  name: string
}

export type ReservationRow = (typeof mockTodayBookings)[number]

export function useReservations(date?: string) {
  const [bookings, setBookings] = useState<ReservationRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const queryDate = date ?? todayIso()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<ApiBooking[]>(`/business/bookings/?booking_date=${queryDate}`),
      apiFetch<ApiMenu[]>('/business/menus/'),
    ])
      .then(([rawBookings, menus]) => {
        const menuMap = Object.fromEntries(menus.map((m) => [m.id, m.name]))
        setBookings(
          rawBookings.map((b, i) => ({
            id: i + 1,
            booking_number: String(b.id).slice(0, 8),
            time: b.start_time.slice(0, 5),
            customer_name: b.customer_name,
            service_name: menuMap[b.menu_id] ?? '세차',
            car_number: '',
            car_model: b.vehicle_model ?? '',
            staff_name: '',
            status: mapBookingStatus(b.status),
            price: b.price,
          })),
        )
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [queryDate])

  const displayBookings = bookings ?? mockTodayBookings

  const todayKpi = useMemo(
    () => ({
      total: displayBookings.length,
      completed: displayBookings.filter((b) => b.status === 'COMPLETED').length,
      pending: displayBookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED').length,
    }),
    [displayBookings],
  )

  return { bookings: displayBookings, todayKpi, loading, error, isLive: bookings !== null }
}
