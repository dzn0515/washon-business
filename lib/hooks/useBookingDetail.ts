'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import {
  fetchBusinessBookingById,
  type ApiMenu,
  updateBookingBay as putBookingBay,
  updateBookingStaff as putBookingStaff,
  updateBookingStatus as putBookingStatus,
  updateBookingPayment as putBookingPayment,
} from '@/lib/bookings-api'
import { parseStatusTransitionError } from '@/lib/booking-status-ui'
import { mapBookingStatus, mapPaymentMethod, mapPaymentStatus } from '@/lib/api-mappers'
import { mockApi } from '@/lib/mock/data'
import { formatResourceName } from '@/lib/resource-label'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import type { Booking, BookingStatus } from '@/types'

export type BookingAssignError = 'bay_conflict' | 'staff_conflict' | 'other' | null

function mapApiToBooking(
  raw: NonNullable<Awaited<ReturnType<typeof fetchBusinessBookingById>>>,
  menu?: ApiMenu,
  bizType?: string | null,
): Booking {
  return {
    id: raw.id,
    booking_number: raw.booking_number,
    user: { id: 0, name: raw.customer_name, phone: raw.customer_phone },
    vehicle: { car_number: '', car_model: raw.vehicle_model ?? '' },
    service_menu: {
      name: menu?.name ?? '서비스',
      duration_minutes: menu?.duration_minutes ?? 60,
    },
    staff: raw.staff_id
      ? {
          id: raw.staff_id,
          name: raw.staff_name ?? '직원',
          color: raw.staff_color ?? undefined,
        }
      : null,
    bay: raw.bay_id
      ? {
          id: raw.bay_id,
          name: raw.bay_name ?? formatResourceName(bizType, raw.bay_number),
          number: raw.bay_number,
        }
      : null,
    booking_date: raw.booking_date,
    booking_time: raw.start_time.slice(0, 5),
    price: raw.price,
    status: mapBookingStatus(raw.status),
    payment_method: mapPaymentMethod(raw.payment_method ?? 'none'),
    payment_status: mapPaymentStatus(raw.payment_status ?? 'unpaid'),
    paid_amount: raw.paid_amount ?? 0,
    paid_at: raw.paid_at,
    memo: raw.note ?? '',
    customer_request: raw.note ?? '',
    created_at: raw.created_at,
  }
}

function parseAssignError(e: unknown): BookingAssignError {
  const err = e as Error & { status?: number }
  if (err.status === 409) {
    if (err.message === 'Bay slot conflict') return 'bay_conflict'
    if (err.message === 'Staff slot conflict') return 'staff_conflict'
  }
  return 'other'
}

export function useBookingDetail(id: string, bookingDate?: string) {
  const { display: businessDisplay } = useBusinessMe()
  const bizType = businessDisplay?.bizType
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [assigningStaff, setAssigningStaff] = useState(false)
  const [assigningBay, setAssigningBay] = useState(false)
  const [bayError, setBayError] = useState<BookingAssignError>(null)
  const [staffError, setStaffError] = useState<BookingAssignError>(null)
  const [statusError, setStatusError] = useState(false)
  const [updatingPayment, setUpdatingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const applyBooking = useCallback(
    (raw: NonNullable<Awaited<ReturnType<typeof fetchBusinessBookingById>>>, menu?: ApiMenu) => {
      setBooking(mapApiToBooking(raw, menu, bizType))
      setIsLive(true)
    },
    [bizType],
  )

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [raw, menus] = await Promise.all([
        fetchBusinessBookingById(id, bookingDate),
        apiFetch<ApiMenu[]>('/business/menus/'),
      ])
      if (!raw) throw new Error('Booking not found')
      const menu = menus.find((m) => m.id === raw.menu_id)
      applyBooking(raw, menu)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.log('[useBookingDetail] API failed, using mock fallback', message)
      setError(message)
      setIsLive(false)
      const numId = Number(id)
      if (!Number.isNaN(numId)) {
        try {
          const mock = await mockApi.getBooking(numId)
          setBooking(mock)
        } catch {
          setBooking(null)
        }
      } else {
        setBooking(null)
      }
    } finally {
      setLoading(false)
    }
  }, [id, bookingDate, applyBooking])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = useCallback(
    async (newStatus: BookingStatus) => {
      if (typeof booking?.id !== 'string') {
        console.log('[useBookingDetail] mock booking, skip API status update')
        return false
      }
      setUpdating(true)
      setStatusError(false)
      try {
        const updated = await putBookingStatus(booking.id, newStatus)
        const menus = await apiFetch<ApiMenu[]>('/business/menus/')
        const menu = menus.find((m) => m.id === updated.menu_id)
        applyBooking(updated, menu)
        return true
      } catch (e) {
        setStatusError(parseStatusTransitionError(e))
        return false
      } finally {
        setUpdating(false)
      }
    },
    [booking?.id, applyBooking],
  )

  const updateStaff = useCallback(
    async (staffId: string | null) => {
      if (typeof booking?.id !== 'string') {
        console.log('[useBookingDetail] mock booking, skip API staff update')
        return false
      }
      setAssigningStaff(true)
      setStaffError(null)
      try {
        const updated = await putBookingStaff(booking.id, staffId)
        const menus = await apiFetch<ApiMenu[]>('/business/menus/')
        const menu = menus.find((m) => m.id === updated.menu_id)
        applyBooking(updated, menu)
        return true
      } catch (e) {
        setStaffError(parseAssignError(e))
        return false
      } finally {
        setAssigningStaff(false)
      }
    },
    [booking?.id, applyBooking],
  )

  const updateBay = useCallback(
    async (bayId: string) => {
      if (typeof booking?.id !== 'string') {
        console.log('[useBookingDetail] mock booking, skip API bay update')
        return false
      }
      setAssigningBay(true)
      setBayError(null)
      try {
        const updated = await putBookingBay(booking.id, bayId)
        const menus = await apiFetch<ApiMenu[]>('/business/menus/')
        const menu = menus.find((m) => m.id === updated.menu_id)
        applyBooking(updated, menu)
        return true
      } catch (e) {
        setBayError(parseAssignError(e))
        return false
      } finally {
        setAssigningBay(false)
      }
    },
    [booking?.id, applyBooking],
  )

  const updatePayment = useCallback(
    async (payload: {
      payment_status: 'unpaid' | 'paid' | 'refunded' | 'cancelled'
      payment_method?: 'onsite' | 'app' | 'none'
      paid_amount?: number
    }) => {
      if (typeof booking?.id !== 'string') return false
      setUpdatingPayment(true)
      setPaymentError(null)
      try {
        const updated = await putBookingPayment(booking.id, payload)
        const menus = await apiFetch<ApiMenu[]>('/business/menus/')
        const menu = menus.find((m) => m.id === updated.menu_id)
        applyBooking(updated, menu)
        return true
      } catch (e) {
        setPaymentError(e instanceof Error ? e.message : '결제 처리에 실패했습니다.')
        return false
      } finally {
        setUpdatingPayment(false)
      }
    },
    [booking?.id, applyBooking],
  )

  return {
    booking,
    loading,
    error,
    isLive,
    updating,
    assigningStaff,
    assigningBay,
    bayError,
    staffError,
    statusError,
    paymentError,
    updatingPayment,
    refetch: load,
    updateStatus,
    updateStaff,
    updateBay,
    updatePayment,
  }
}
