'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchBusinessBookings,
  type ApiBooking,
  type ApiMenu,
} from '@/lib/bookings-api'
import { updateBookingStatus as patchReservationStatus } from '@/lib/store-api'
import { apiFetch } from '@/lib/api-client'
import { mapBookingStatus, mapPaymentStatus, todayIso } from '@/lib/api-mappers'
import { mockTodayBookings } from '@/lib/mock/data'
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

function mapBookingRow(b: ApiBooking, menuMap: Record<string, ApiMenu>): ReservationRow {
  const vehicle = parseVehicleFromModel(b.vehicle_model)
  return {
    id: b.id,
    booking_number: b.booking_number,
    time: b.start_time.slice(0, 5),
    customer_name: b.customer_name,
    service_name: menuMap[b.menu_id]?.name ?? '세차',
    car_number: vehicle?.license_plate ?? '',
    car_model: b.vehicle_model ?? '',
    staff_name: '',
    status: mapBookingStatus(b.status),
    payment_status: mapPaymentStatus(b.payment_status ?? 'unpaid'),
    price: b.price,
    vehicle,
  }
}

export function useReservations(initialDate?: string) {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? todayIso())
  const [bookings, setBookings] = useState<ReservationRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadBookings = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const [rawBookings, menus] = await Promise.all([
        fetchBusinessBookings(date),
        apiFetch<ApiMenu[]>('/business/menus/'),
      ])
      const menuMap = Object.fromEntries(menus.map((m) => [m.id, m]))
      setBookings(rawBookings.map((b) => mapBookingRow(b, menuMap)))
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.log('[useReservations] API failed, using mock fallback', message)
      setError(message)
      setBookings(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBookings(selectedDate)
  }, [selectedDate, loadBookings])

  const displayBookings: ReservationRow[] = bookings ?? (mockTodayBookings as ReservationRow[])

  const todayKpi = useMemo(
    () => ({
      total: displayBookings.length,
      completed: displayBookings.filter((b) =>
        ['completed', 'paid', 'reviewed'].includes(b.status),
      ).length,
      pending: displayBookings.filter((b) =>
        ['pending', 'waiting', 'confirmed', 'arrived', 'in_progress'].includes(b.status),
      ).length,
    }),
    [displayBookings],
  )

  const updateStatus = useCallback(
    async (bookingId: string | number, newStatus: BookingStatus) => {
      if (typeof bookingId !== 'string') {
        console.log('[useReservations] mock booking id, skip API status update', bookingId)
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
    loading,
    error,
    isLive: bookings !== null,
    selectedDate,
    setSelectedDate,
    refetch: () => loadBookings(selectedDate),
    updateStatus,
    updatingId,
    setBookings,
  }
}
