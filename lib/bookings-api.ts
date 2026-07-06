import type { BookingStatus } from '@/types'
import { apiFetch } from '@/lib/api-client'
import { mapBookingStatusToApi } from '@/lib/api-mappers'

export type ReservationSource = 'app' | 'local' | 'block'

export type ApiBooking = {
  id: string
  menu_id: string | null
  menu_name?: string | null
  booking_date: string
  start_time: string
  end_time: string
  bay_id: string | null
  bay_number: number
  bay_name: string | null
  staff_id: string | null
  staff_name: string | null
  staff_color: string | null
  price: number
  status: string
  source?: ReservationSource
  block_reason?: string | null
  customer_name: string
  customer_phone: string
  vehicle_model: string | null
  vehicle_number?: string | null
  vehicle_type?: string | null
  booking_number: string
  note: string | null
  payment_method: 'onsite' | 'app' | 'none'
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'cancelled'
  paid_amount: number
  paid_at: string | null
  refunded_at: string | null
  created_at: string
}

export type ApiMenu = {
  id: string
  name: string
  duration_minutes: number
}

export type LocalReservationPayload = {
  customer_name: string
  customer_phone: string
  vehicle_number?: string
  vehicle_type?: string
  menu_id: string
  booking_date: string
  start_time: string
  end_time: string
  bay_id?: string
  staff_id?: string
  note?: string
}

export type BlockReservationPayload = {
  block_reason: string
  booking_date: string
  start_time: string
  end_time: string
  bay_id?: string
  note?: string
}

export async function fetchBusinessReservations(bookingDate?: string): Promise<ApiBooking[]> {
  const qs = bookingDate ? `?booking_date=${bookingDate}` : ''
  return apiFetch<ApiBooking[]>(`/business/reservations/${qs}`)
}

/** @deprecated use fetchBusinessReservations */
export async function fetchBusinessBookings(bookingDate?: string): Promise<ApiBooking[]> {
  return fetchBusinessReservations(bookingDate)
}

export async function fetchBusinessBookingById(
  id: string,
  bookingDate?: string,
): Promise<ApiBooking | null> {
  try {
    return await apiFetch<ApiBooking>(`/business/bookings/${id}`)
  } catch {
    const list = await fetchBusinessReservations(bookingDate)
    const found = list.find((b) => b.id === id)
    if (found) return found
    if (bookingDate) {
      const all = await fetchBusinessReservations()
      return all.find((b) => b.id === id) ?? null
    }
    return null
  }
}

export async function createLocalReservation(data: LocalReservationPayload): Promise<ApiBooking> {
  return apiFetch<ApiBooking>('/business/reservations/local', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function createBlockReservation(data: BlockReservationPayload): Promise<ApiBooking> {
  return apiFetch<ApiBooking>('/business/reservations/block', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<ApiBooking> {
  return apiFetch<ApiBooking>(`/business/bookings/${bookingId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: mapBookingStatusToApi(status) }),
  })
}

export async function updateBookingStaff(
  bookingId: string,
  staffId: string | null,
): Promise<ApiBooking> {
  return apiFetch<ApiBooking>(`/business/bookings/${bookingId}/staff`, {
    method: 'PUT',
    body: JSON.stringify({ staff_id: staffId }),
  })
}

export async function updateBookingBay(
  bookingId: string,
  bayId: string,
): Promise<ApiBooking> {
  return apiFetch<ApiBooking>(`/business/bookings/${bookingId}/bay`, {
    method: 'PUT',
    body: JSON.stringify({ bay_id: bayId }),
  })
}

export type BookingPaymentPayload = {
  payment_method?: 'onsite' | 'app' | 'none'
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'cancelled'
  paid_amount?: number
}

export async function updateBookingPayment(
  bookingId: string,
  data: BookingPaymentPayload,
): Promise<ApiBooking> {
  return apiFetch<ApiBooking>(`/business/bookings/${bookingId}/payment`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
