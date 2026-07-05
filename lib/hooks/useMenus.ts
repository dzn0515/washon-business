'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { pricesToGrid } from '@/lib/api-mappers'
import type { BusinessHours } from '@/types'

type ApiMenu = {
  id: string
  name: string
  duration_minutes: number
  is_active: boolean
  is_popular: boolean
  prices: { vehicle_size: string; vehicle_origin: string; price: number }[]
}

type ApiHours = {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

type ApiHoliday = {
  id: string
  start_date: string
  end_date: string
  reason: string | null
  type: string
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export type MenuCard = {
  id: number
  name: string
  duration_minutes: number
  monthly_bookings: number
  is_popular: boolean
  is_active: boolean
  price_grid: ReturnType<typeof pricesToGrid>
}

type HolidayCard = {
  id: number
  date: string
  reason: string
  type: 'HOLIDAY' | 'RAIN'
}

export function useMenus() {
  const [menus, setMenus] = useState<MenuCard[] | null>(null)
  const [hours, setHours] = useState<BusinessHours[] | null>(null)
  const [holidays, setHolidays] = useState<HolidayCard[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      apiFetch<ApiMenu[]>('/business/menus/?include_inactive=true'),
      apiFetch<ApiHours[]>('/business/hours'),
      apiFetch<ApiHoliday[]>('/business/holidays'),
    ])
      .then(([apiMenus, apiHours, apiHolidays]) => {
        setMenus(
          apiMenus.map((m, i) => ({
            id: i + 1,
            name: m.name,
            duration_minutes: m.duration_minutes,
            monthly_bookings: 0,
            is_popular: m.is_popular,
            is_active: m.is_active,
            price_grid: pricesToGrid(m.prices),
          })),
        )
        setHours(
          apiHours.map((h) => ({
            day: h.day_of_week,
            label: DAY_LABELS[h.day_of_week] ?? String(h.day_of_week),
            is_open: !h.is_closed,
            open_time: h.open_time.slice(0, 5),
            close_time: h.close_time.slice(0, 5),
          })),
        )
        setHolidays(
          apiHolidays.map((h, i) => ({
            id: i + 1,
            date: h.start_date === h.end_date ? h.start_date : `${h.start_date} ~ ${h.end_date}`,
            reason: h.reason ?? '휴무',
            type: h.type === 'rain' ? 'RAIN' : 'HOLIDAY',
          })),
        )
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return {
    menus: menus ?? [],
    hours: hours ?? [],
    holidays: holidays ?? [],
    loading,
    error,
    isLive: menus !== null,
  }
}
