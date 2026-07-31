'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  fetchBusinessReservations,
  type ApiBooking,
  type ApiMenu,
  type ReservationSource,
} from '@/lib/bookings-api'
import { updateBookingStatus as patchReservationStatus } from '@/lib/store-api'
import { apiFetch } from '@/lib/api-client'
import { mapBookingStatus, mapPaymentStatus, todayIso } from '@/lib/api-mappers'
import { mockTodayBookings } from '@/lib/mock/data'
import { normalizeReservationSource } from '@/lib/reservation-ui'
import {
  emptyStateCopy,
  isPaymentPending,
  monthRange,
  next7DaysRange,
  relativeBookingLabel,
  todayIsoKst,
  tomorrowIso,
  type ScheduleFilter,
} from '@/lib/booking-schedule'
import type { BookingStatus, PaymentStatus } from '@/types'

export type ReservationVehicle = {
  brand?: string
  model?: string
  license_plate: string
}

export type ReservationRow = Omit<(typeof mockTodayBookings)[number], 'id' | 'status'> & {
  id: string | number
  status: BookingStatus
  payment_status?: PaymentStatus
  payment_method?: 'onsite' | 'app' | 'none'
  source: ReservationSource
  block_reason?: string | null
  end_time?: string
  bay_name?: string | null
  booking_date?: string
  customer_phone?: string
  vehicle?: ReservationVehicle | null
}

function parseVehicleFromModel(model: string | null): ReservationVehicle | null {
  if (!model?.trim()) return null
  const match = model.match(/^(.+?)\s*\(([^)]+)\)$/)
  if (match) {
    const nameParts = match[1].trim().split(/\s+/)
    return {
      brand: nameParts[0],
      model: nameParts.slice(1).join(' ') || undefined,
      license_plate: match[2].trim(),
    }
  }
  return { license_plate: model.trim() }
}

function fallbackMenuName(menuId: string): string {
  return `메뉴 #${menuId}`
}

function mapBookingRow(b: ApiBooking, menuMap: Record<string, ApiMenu>): ReservationRow {
  const vehicle = parseVehicleFromModel(b.vehicle_model)
  const source = normalizeReservationSource(b.source)
  const serviceName =
    source === 'block'
      ? (b.block_reason ?? b.menu_name ?? '시간 차단')
      : (b.menu_name ?? menuMap[b.menu_id ?? '']?.name ?? fallbackMenuName(b.menu_id ?? ''))
  return {
    id: b.id,
    booking_number: b.booking_number,
    time: b.start_time.slice(0, 5),
    end_time: b.end_time.slice(0, 5),
    customer_name: source === 'block' ? (b.block_reason ?? b.customer_name) : b.customer_name,
    service_name: serviceName,
    car_number: b.vehicle_number ?? vehicle?.license_plate ?? '',
    car_model: b.vehicle_type ?? b.vehicle_model ?? '',
    staff_name: b.staff_name ?? '',
    bay_name: b.bay_name,
    status: mapBookingStatus(b.status),
    payment_status: mapPaymentStatus(b.payment_status ?? 'unpaid'),
    payment_method: b.payment_method,
    price: b.price,
    source,
    block_reason: b.block_reason ?? undefined,
    booking_date: b.booking_date?.slice(0, 10),
    customer_phone: b.customer_phone,
    vehicle,
  }
}

function parseFilter(raw: string | null): ScheduleFilter {
  const allowed: ScheduleFilter[] = [
    'today',
    'tomorrow',
    'next7',
    'upcoming',
    'date',
    'calendar',
    'past',
  ]
  if (raw && (allowed as string[]).includes(raw)) return raw as ScheduleFilter
  return 'today'
}

export function useReservations(initialDate?: string) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filter = parseFilter(searchParams.get('filter'))
  const selectedDate =
    searchParams.get('date') || initialDate || todayIsoKst()
  const calendarMonth =
    searchParams.get('month') || selectedDate.slice(0, 7) // YYYY-MM

  const [bookings, setBookings] = useState<ReservationRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [monthBookings, setMonthBookings] = useState<ReservationRow[]>([])
  const [summary, setSummary] = useState({
    today: 0,
    tomorrow: 0,
    next7: 0,
    paymentPending: 0,
  })
  const [nextHint, setNextHint] = useState<string | null>(null)

  const setFilter = useCallback(
    (next: ScheduleFilter, date?: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('filter', next)
      if (date) params.set('date', date)
      if (next === 'calendar' && date) params.set('month', date.slice(0, 7))
      router.replace(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const setSelectedDate = useCallback(
    (date: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('date', date)
      if (filter === 'today' || filter === 'tomorrow') {
        params.set('filter', 'date')
      }
      if (filter === 'calendar') params.set('month', date.slice(0, 7))
      router.replace(`${pathname}?${params.toString()}`)
    },
    [filter, pathname, router, searchParams],
  )

  const setCalendarMonth = useCallback(
    (ym: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('filter', 'calendar')
      params.set('month', ym)
      const day = selectedDate.startsWith(ym) ? selectedDate : `${ym}-01`
      params.set('date', day)
      router.replace(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams, selectedDate],
  )

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const today = todayIsoKst()
      const tomorrow = tomorrowIso()
      const week = next7DaysRange()
      const [y, m] = calendarMonth.split('-').map(Number)
      const month = monthRange(y, m - 1)

      let query: Parameters<typeof fetchBusinessReservations>[0]
      if (filter === 'today') {
        query = { bookingDate: today, sort: 'booking_datetime_asc' }
      } else if (filter === 'tomorrow') {
        query = { bookingDate: tomorrow, sort: 'booking_datetime_asc' }
      } else if (filter === 'next7') {
        query = {
          dateFrom: week.from,
          dateTo: week.to,
          sort: 'booking_datetime_asc',
        }
      } else if (filter === 'upcoming') {
        query = {
          dateFrom: today,
          statuses: 'pending,confirmed,arrived,in_progress',
          sort: 'booking_datetime_asc',
          limit: 100,
        }
      } else if (filter === 'past') {
        query = {
          dateTo: today,
          sort: 'booking_datetime_desc',
          limit: 100,
        }
      } else if (filter === 'calendar') {
        query = {
          dateFrom: month.from,
          dateTo: month.to,
          sort: 'booking_datetime_asc',
        }
      } else {
        query = { bookingDate: selectedDate, sort: 'booking_datetime_asc' }
      }

      const [rawBookings, menusResult, todayRaw, tomorrowRaw, weekRaw, pendingRaw, nextRaw] =
        await Promise.all([
          fetchBusinessReservations(query),
          Promise.allSettled([apiFetch<ApiMenu[]>('/business/menus/')]),
          fetchBusinessReservations({ bookingDate: today }),
          fetchBusinessReservations({ bookingDate: tomorrow }),
          fetchBusinessReservations({ dateFrom: week.from, dateTo: week.to }),
          fetchBusinessReservations({
            dateFrom: today,
            statuses: 'pending',
            paymentStatuses: 'unpaid',
            sort: 'booking_datetime_asc',
            limit: 50,
          }),
          fetchBusinessReservations({
            dateFrom: today,
            statuses: 'pending,confirmed,arrived,in_progress',
            sort: 'booking_datetime_asc',
            limit: 5,
          }),
        ])

      const menus = menusResult[0].status === 'fulfilled' ? menusResult[0].value : []
      const menuMap = Object.fromEntries(menus.map((m) => [m.id, m]))

      let rows = rawBookings.map((b) => mapBookingRow(b, menuMap))
      if (filter === 'calendar') {
        setMonthBookings(rows)
        rows = rows.filter((r) => (r.booking_date ?? '') === selectedDate)
      } else {
        setMonthBookings([])
      }
      if (filter === 'past') {
        rows = rows.filter((r) => (r.booking_date ?? '') < today)
      }

      setBookings(rows)
      setSummary({
        today: todayRaw.filter((b) => b.source !== 'block').length,
        tomorrow: tomorrowRaw.filter((b) => b.source !== 'block').length,
        next7: weekRaw.filter((b) => b.source !== 'block').length,
        paymentPending: pendingRaw.filter(
          (b) =>
            isPaymentPending(b.status, b.payment_status, b.payment_method) &&
            b.source !== 'block',
        ).length,
      })

      const next = nextRaw.find((b) => b.source !== 'block')
      if (next) {
        const label = relativeBookingLabel(next.booking_date.slice(0, 10))
        setNextHint(`다음 예약은 ${label} ${next.start_time.slice(0, 5)}입니다.`)
      } else {
        setNextHint(null)
      }

      if (menusResult[0].status === 'rejected') {
        setError('menus API failed; bookings are live')
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.log('[useReservations] API failed, using mock fallback', message)
      setError(message)
      setBookings(null)
    } finally {
      setLoading(false)
    }
  }, [calendarMonth, filter, selectedDate])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  const displayBookings: ReservationRow[] = bookings ?? (mockTodayBookings as ReservationRow[])

  const todayKpi = useMemo(
    () => ({
      total: summary.today,
      completed: displayBookings.filter((b) =>
        ['completed', 'paid', 'reviewed'].includes(b.status),
      ).length,
      pending: summary.paymentPending,
    }),
    [displayBookings, summary.paymentPending, summary.today],
  )

  const calendarCounts = useMemo(() => {
    const map: Record<string, { total: number; confirmed: number; pending: number }> = {}
    for (const b of monthBookings) {
      if (b.source === 'block') continue
      const d = b.booking_date ?? ''
      if (!d) continue
      if (!map[d]) map[d] = { total: 0, confirmed: 0, pending: 0 }
      map[d].total += 1
      if (isPaymentPending(b.status, b.payment_status, b.payment_method)) map[d].pending += 1
      else if (b.status === 'confirmed' || b.payment_status === 'PAID') map[d].confirmed += 1
    }
    return map
  }, [monthBookings])

  const updateStatus = useCallback(
    async (bookingId: string | number, newStatus: BookingStatus) => {
      if (typeof bookingId !== 'string') {
        setBookings((prev) =>
          (prev ?? (mockTodayBookings as ReservationRow[])).map((b) =>
            b.id === bookingId ? { ...b, status: newStatus } : b,
          ),
        )
        return true
      }
      setUpdatingId(bookingId)
      try {
        await patchReservationStatus(bookingId, newStatus)
        setBookings((prev) =>
          (prev ?? []).map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
        )
        return true
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        console.log('[useReservations] status update failed', message)
        return false
      } finally {
        setUpdatingId(null)
      }
    },
    [],
  )

  return {
    bookings: displayBookings,
    todayKpi,
    summary,
    nextHint,
    emptyMessage: emptyStateCopy(filter, selectedDate),
    filter,
    setFilter,
    loading,
    error,
    isLive: bookings !== null,
    selectedDate,
    setSelectedDate,
    calendarMonth,
    setCalendarMonth,
    calendarCounts,
    refetch: () => loadBookings(),
    updateStatus,
    updatingId,
    setBookings,
  }
}

// keep todayIso export used by callers expecting previous hook shape
export { todayIso }
