'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchBusinessBookings,
  type ApiBooking,
  type ApiMenu,
} from '@/lib/bookings-api'
import { apiFetch } from '@/lib/api-client'
import { mapBookingStatus, mapPaymentStatus, todayIso } from '@/lib/api-mappers'
import {
  minutesToTime,
  timeToMinutes,
  type CalendarBooking,
} from '@/lib/calendar-utils'
import { mockBays, mockStaffMembers, mockTodayBookings } from '@/lib/mock/data'
import type { BusinessBay } from '@/types'

type ApiBay = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

function mapBay(row: ApiBay): BusinessBay {
  return {
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }
}

function mapApiBooking(
  b: ApiBooking,
  menuMap: Record<string, ApiMenu>,
): CalendarBooking {
  return {
    id: b.id,
    customer_name: b.customer_name,
    service_name: menuMap[b.menu_id]?.name ?? '세차',
    car_model: b.vehicle_model ?? '',
    status: mapBookingStatus(b.status),
    payment_status: mapPaymentStatus(b.payment_status ?? 'unpaid'),
    start_time: b.start_time.slice(0, 5),
    end_time: b.end_time.slice(0, 5),
    bay_id: b.bay_id,
    bay_number: b.bay_number,
    staff_name: b.staff_name,
    staff_color: b.staff_color,
  }
}

const MOCK_DURATIONS: Record<number, number> = {
  1: 60,
  2: 60,
  3: 60,
  4: 120,
  5: 60,
  6: 30,
  7: 60,
}

function mockCalendarBookings(): CalendarBooking[] {
  const rows: CalendarBooking[] = mockTodayBookings.map((b, index) => {
    const start = b.time
    const duration = MOCK_DURATIONS[Number(b.id)] ?? 60
    const end = minutesToTime(timeToMinutes(start) + duration)
    const bay = mockBays[index % mockBays.length]
    const staffMember = mockStaffMembers.find((s) => s.name === b.staff_name)
    return {
      id: b.id,
      customer_name: b.customer_name,
      service_name: b.service_name,
      car_model: b.car_model,
      status: b.status as CalendarBooking['status'],
      start_time: start,
      end_time: end,
      bay_id: bay.id,
      bay_number: bay.sort_order,
      staff_name: staffMember?.name ?? b.staff_name ?? null,
      staff_color: staffMember?.color ?? null,
    }
  })
  rows.push({
    id: 'mock-cancelled',
    customer_name: '취소고객',
    service_name: '외부 세차',
    car_model: '현대 아이오닉',
    status: 'cancelled',
    start_time: '12:00',
    end_time: '13:00',
    bay_id: mockBays[1].id,
    bay_number: mockBays[1].sort_order,
    staff_name: null,
    staff_color: null,
  })
  return rows
}

export function useBayCalendar(initialDate?: string) {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? todayIso())
  const [bookings, setBookings] = useState<CalendarBooking[] | null>(null)
  const [bays, setBays] = useState<BusinessBay[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const [rawBookings, menus, rawBays] = await Promise.all([
        fetchBusinessBookings(date),
        apiFetch<ApiMenu[]>('/business/menus/'),
        apiFetch<ApiBay[]>('/business/bays/'),
      ])
      const menuMap = Object.fromEntries(menus.map((m) => [m.id, m]))
      setBookings(rawBookings.map((b) => mapApiBooking(b, menuMap)))
      setBays(rawBays.map(mapBay))
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.log('[useBayCalendar] API failed, using mock fallback', message)
      setError(message)
      setBookings(null)
      setBays(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(selectedDate)
  }, [selectedDate, load])

  return {
    bookings: bookings ?? mockCalendarBookings(),
    bays: bays ?? mockBays,
    loading,
    error,
    isLive: bookings !== null && bays !== null,
    selectedDate,
    setSelectedDate,
    refetch: () => load(selectedDate),
  }
}
