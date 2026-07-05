'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { mapBookingStatus } from '@/lib/api-mappers'

type ApiDashboard = {
  today_sales: number
  today_bookings: number
  pending_bookings: number
  monthly_sales: number
  monthly_growth: number
  app_exposure: number
  new_customers: number
  today_reservations: {
    id: string
    time: string
    customer_name: string
    service_name: string
    price: number
    status: string
  }[]
}

const EMPTY_DASHBOARD = {
  today_bookings: 0,
  today_bookings_diff: 0,
  today_revenue: 0,
  monthly_revenue: 0,
  monthly_revenue_diff: 0,
  unsettled_amount: 0,
  unsettled_date: '',
  new_customers: 0,
  new_customers_diff: 0,
  app_exposure: 0,
}

export type DashboardData = typeof EMPTY_DASHBOARD
export type TodayBookingRow = {
  id: number
  booking_number: string
  time: string
  customer_name: string
  service_name: string
  car_number: string
  car_model: string
  staff_name: string
  status: ReturnType<typeof mapBookingStatus>
  price: number
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [todayBookings, setTodayBookings] = useState<TodayBookingRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<ApiDashboard>('/business/dashboard')
      .then((api) => {
        setDashboard({
          today_bookings: api.today_bookings,
          today_bookings_diff: api.pending_bookings,
          today_revenue: api.today_sales,
          monthly_revenue: api.monthly_sales,
          monthly_revenue_diff: api.monthly_growth,
          unsettled_amount: 0,
          unsettled_date: '',
          new_customers: api.new_customers,
          new_customers_diff: 0,
          app_exposure: api.app_exposure,
        })
        setTodayBookings(
          api.today_reservations.map((b, i) => ({
            id: i + 1,
            booking_number: String(b.id).slice(0, 8),
            time: b.time,
            customer_name: b.customer_name,
            service_name: b.service_name,
            car_number: '',
            car_model: '',
            staff_name: '',
            status: mapBookingStatus(b.status),
            price: b.price,
          })),
        )
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return {
    dashboard: dashboard ?? EMPTY_DASHBOARD,
    todayBookings: todayBookings ?? [],
    loading,
    error,
    isLive: dashboard !== null,
  }
}
