'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mapBookingStatus, todayIso } from '@/lib/api-mappers'
import { mockDashboardToday } from '@/lib/mock/data'
import type { BookingStatus } from '@/types'

export type DashboardTodayData = {
  date: string
  total_bookings: number
  status_counts: {
    pending: number
    confirmed: number
    in_progress: number
    completed: number
    cancelled: number
    noshow: number
  }
  expected_revenue: number
  bay_summary: {
    total: number
    active: number
    busy_now: number
    available_now: number
  }
  staff_summary: {
    staff_id: string | null
    name: string
    color: string
    assigned_count: number
    active: boolean
  }[]
  current_bookings: DashboardTodayBooking[]
  next_bookings: DashboardTodayBooking[]
}

export type DashboardTodayBooking = {
  id: string
  booking_number: string
  customer_name: string
  service_name: string
  start_time: string
  end_time: string
  status: BookingStatus
  bay_id: string | null
  bay_name: string | null
  staff_id: string | null
  staff_name: string | null
  price: number
}

type ApiToday = {
  date: string
  total_bookings: number
  status_counts: DashboardTodayData['status_counts']
  expected_revenue: number
  bay_summary: DashboardTodayData['bay_summary']
  staff_summary: DashboardTodayData['staff_summary']
  current_bookings: {
    id: string
    booking_number: string
    customer_name: string
    service_name: string
    start_time: string
    end_time: string
    status: string
    bay_id: string | null
    bay_name: string | null
    staff_id: string | null
    staff_name: string | null
    price: number
  }[]
  next_bookings: {
    id: string
    booking_number: string
    customer_name: string
    service_name: string
    start_time: string
    end_time: string
    status: string
    bay_id: string | null
    bay_name: string | null
    staff_id: string | null
    staff_name: string | null
    price: number
  }[]
}

function mapBooking(b: ApiToday['current_bookings'][number]): DashboardTodayBooking {
  return {
    ...b,
    status: mapBookingStatus(b.status),
  }
}

function mapToday(api: ApiToday): DashboardTodayData {
  return {
    date: api.date,
    total_bookings: api.total_bookings,
    status_counts: api.status_counts,
    expected_revenue: api.expected_revenue,
    bay_summary: api.bay_summary,
    staff_summary: api.staff_summary,
    current_bookings: api.current_bookings.map(mapBooking),
    next_bookings: api.next_bookings.map(mapBooking),
  }
}

function mapMockToday(): DashboardTodayData {
  const m = mockDashboardToday
  return {
    ...m,
    current_bookings: m.current_bookings.map((b) => ({
      ...b,
      status: mapBookingStatus(b.status),
    })),
    next_bookings: m.next_bookings.map((b) => ({
      ...b,
      status: mapBookingStatus(b.status),
    })),
  }
}

export function useDashboardToday() {
  const [data, setData] = useState<DashboardTodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    return apiFetch<ApiToday>('/business/dashboard/today')
      .then((api) => setData(mapToday(api)))
      .catch((e: Error) => {
        console.log('[useDashboardToday] API failed, using mock fallback', e.message)
        setError(e.message)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const display = data ?? mapMockToday()
  const todayDate = display.date || todayIso()

  return {
    today: display,
    loading,
    error,
    isLive: data !== null,
    refetch: load,
    todayDate,
  }
}
