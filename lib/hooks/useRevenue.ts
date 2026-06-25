'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import {
  mockRevenueTodayKpi,
  mockRevenueWeeklyKpi,
  mockRevenueMonthlyKpi,
  mockRevenueByMenu,
  mockPaymentsToday,
} from '@/lib/mock/data'

type ApiRevenueSummary = {
  today_sales: number
  weekly_sales: number
  monthly_sales: number
  average_ticket: number
  completed_count: number
  noshow_count: number
  maintenance_fee: number
}

type ApiRevenueByMenu = {
  menu_name: string
  amount: number
  pct: number
}

type ApiBooking = {
  id: string
  start_time: string
  customer_name: string
  price: number
  menu_id: string
  status: string
}

type ApiMenu = { id: string; name: string }

export function useRevenue() {
  const [todayKpi, setTodayKpi] = useState<typeof mockRevenueTodayKpi | null>(null)
  const [weeklyKpi, setWeeklyKpi] = useState<typeof mockRevenueWeeklyKpi | null>(null)
  const [monthlyKpi, setMonthlyKpi] = useState<typeof mockRevenueMonthlyKpi | null>(null)
  const [byMenu, setByMenu] = useState<typeof mockRevenueByMenu | null>(null)
  const [paymentsToday, setPaymentsToday] = useState<typeof mockPaymentsToday | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      apiFetch<ApiRevenueSummary>('/business/revenue/summary'),
      apiFetch<ApiRevenueByMenu[]>('/business/revenue/by-menu?period=today'),
      apiFetch<ApiBooking[]>(`/business/bookings/?booking_date=${today}`),
      apiFetch<ApiMenu[]>('/business/menus/'),
    ])
      .then(([summary, menuRows, bookings, menus]) => {
        const menuMap = Object.fromEntries(menus.map((m) => [m.id, m.name]))
        const completed = bookings.filter((b) => b.status === 'completed')

        setTodayKpi({
          today_sales: summary.today_sales,
          completed_count: summary.completed_count,
          pending_settlement: summary.monthly_sales - summary.today_sales,
          app_maintenance_fee: summary.maintenance_fee,
        })
        setWeeklyKpi({
          week_sales: summary.weekly_sales,
          week_bookings: summary.completed_count,
        })
        setMonthlyKpi({
          month_sales: summary.monthly_sales,
          month_bookings: summary.completed_count,
          platform_fee: Math.round(summary.monthly_sales * 0.1),
          app_maintenance_fee: summary.maintenance_fee,
        })
        setByMenu(
          menuRows.map((m) => ({
            name: m.menu_name,
            amount: m.amount,
            pct: m.pct,
          })),
        )
        setPaymentsToday(
          completed
            .filter((b) => b.price > 0)
            .slice(0, 20)
            .map((b, i) => ({
              id: i + 1,
              time: b.start_time.slice(0, 5),
              customer_name: b.customer_name,
              menu: menuMap[b.menu_id] ?? '세차',
              amount: b.price,
              method: '앱결제',
            })),
        )
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return {
    todayKpi: todayKpi ?? mockRevenueTodayKpi,
    weeklyKpi: weeklyKpi ?? mockRevenueWeeklyKpi,
    monthlyKpi: monthlyKpi ?? mockRevenueMonthlyKpi,
    byMenu: byMenu ?? mockRevenueByMenu,
    paymentsToday: paymentsToday ?? mockPaymentsToday,
    loading,
    error,
    isLive: todayKpi !== null,
  }
}
