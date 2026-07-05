'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mapBookingStatus, todayIso } from '@/lib/api-mappers'
import { isDemoMode } from '@/lib/demo-mode'
import { mockDashboardToday } from '@/lib/mock/data'
import type { BookingStatus } from '@/types'

/**
 * Dashboard data policy:
 * - isDemo=true: mock only (demo preview)
 * - isDemo=false + API 200: live data
 * - isDemo=false + API fail: empty state + isUnavailable (never mock fallback)
 */

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

export function emptyDashboardToday(date = todayIso()): DashboardTodayData {
  return {
    date,
    total_bookings: 0,
    status_counts: {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      noshow: 0,
    },
    expected_revenue: 0,
    bay_summary: { total: 0, active: 0, busy_now: 0, available_now: 0 },
    staff_summary: [],
    current_bookings: [],
    next_bookings: [],
  }
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
  const isDemo = isDemoMode()

  const load = useCallback(() => {
    if (isDemo) {
      setData(null)
      setError(null)
      setLoading(false)
      return Promise.resolve()
    }

    setLoading(true)
    setError(null)
    return apiFetch<ApiToday>('/business/dashboard/today')
      .then((api) => setData(mapToday(api)))
      .catch((e: Error) => {
        console.log('[useDashboardToday] API failed', e.message)
        setError(e.message)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [isDemo])

  useEffect(() => {
    void load()
  }, [load])

  const today = isDemo ? mapMockToday() : (data ?? emptyDashboardToday())
  const todayDate = today.date || todayIso()
  const isLive = !isDemo && data !== null
  const isUnavailable = !isDemo && !loading && data === null

  return {
    today,
    loading,
    error,
    isLive,
    isDemo,
    isUnavailable,
    refetch: load,
    todayDate,
  }
}
