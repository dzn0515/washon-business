'use client'

import { useCallback, useEffect, useState } from 'react'
import { buildDashboardTodayFromBookings } from '@/lib/build-dashboard-today'
import { todayIso } from '@/lib/api-mappers'
import { fetchBusinessBookings, type ApiBooking } from '@/lib/bookings-api'
import { isDemoMode } from '@/lib/demo-mode'
import { mockDashboardToday } from '@/lib/mock/data'
import { fetchBusinessMe } from '@/lib/store-api'
import type { BookingStatus } from '@/types'

/**
 * Dashboard data policy:
 * - isDemo=true: mock only (demo preview)
 * - isDemo=false: /business/me + /business/bookings (live or empty)
 * - API fail: isUnavailable (never silent mock fallback)
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

function mapMockToday(): DashboardTodayData {
  const m = mockDashboardToday
  return {
    ...m,
    current_bookings: m.current_bookings.map((b) => ({
      ...b,
      status: b.status as BookingStatus,
    })),
    next_bookings: m.next_bookings.map((b) => ({
      ...b,
      status: b.status as BookingStatus,
    })),
  }
}

async function loadMenuNames(): Promise<Map<string, string>> {
  try {
    const { apiFetch } = await import('@/lib/api-client')
    const menus = await apiFetch<{ id: string; name: string }[]>('/business/menus/')
    return new Map(menus.map((m) => [m.id, m.name]))
  } catch {
    return new Map()
  }
}

export function useDashboardToday() {
  const [data, setData] = useState<DashboardTodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDemo = isDemoMode()
  const todayDate = todayIso()

  const load = useCallback(() => {
    if (isDemo) {
      setData(null)
      setError(null)
      setLoading(false)
      return Promise.resolve()
    }

    setLoading(true)
    setError(null)

    return Promise.all([
      fetchBusinessMe(),
      fetchBusinessBookings(todayDate),
      loadMenuNames(),
    ])
      .then(([me, bookings, menuNames]) => {
        setData(
          buildDashboardTodayFromBookings(bookings as ApiBooking[], {
            bayCount: me.bay_count ?? 1,
            date: todayDate,
            menuNames,
          }),
        )
      })
      .catch((e: Error) => {
        console.log('[useDashboardToday] API failed', e.message)
        setError(e.message)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [isDemo, todayDate])

  useEffect(() => {
    void load()
  }, [load])

  const today = isDemo ? mapMockToday() : (data ?? emptyDashboardToday(todayDate))
  const isLive = !isDemo && data !== null
  const isUnavailable = !isDemo && !loading && data === null
  const isEmpty = isLive && today.total_bookings === 0

  return {
    today,
    loading,
    error,
    isLive,
    isDemo,
    isUnavailable,
    isEmpty,
    refetch: load,
    todayDate,
  }
}
