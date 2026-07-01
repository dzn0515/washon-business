import type { BookingStatus, PaymentStatus, BusinessBay } from '@/types'

export const CALENDAR_START_HOUR = 9
export const CALENDAR_END_HOUR = 20
export const SLOT_MINUTES = 30
export const ROW_HEIGHT_PX = 44

export type CalendarBooking = {
  id: string | number
  customer_name: string
  service_name: string
  car_model: string
  status: BookingStatus
  payment_status?: PaymentStatus
  start_time: string
  end_time: string
  bay_id: string | null
  bay_number: number | null
  staff_name: string | null
  staff_color: string | null
}

export function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = CALENDAR_START_HOUR; hour < CALENDAR_END_HOUR; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
    slots.push(`${String(hour).padStart(2, '0')}:30`)
  }
  return slots
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const DAY_START_MINUTES = CALENDAR_START_HOUR * 60
const DAY_END_MINUTES = CALENDAR_END_HOUR * 60

export function bookingBlockStyle(startTime: string, endTime: string) {
  const start = Math.max(timeToMinutes(startTime), DAY_START_MINUTES)
  const end = Math.min(timeToMinutes(endTime), DAY_END_MINUTES)
  const top = ((start - DAY_START_MINUTES) / SLOT_MINUTES) * ROW_HEIGHT_PX
  const height = Math.max(((end - start) / SLOT_MINUTES) * ROW_HEIGHT_PX, ROW_HEIGHT_PX * 0.5)
  return { top, height }
}

/** bay_id 우선, 없으면 bay_number ↔ sort_order */
export function resolveBookingBayId(
  booking: Pick<CalendarBooking, 'bay_id' | 'bay_number'>,
  bays: BusinessBay[],
): string | null {
  if (booking.bay_id) {
    const byId = bays.find((b) => b.id === booking.bay_id)
    if (byId) return byId.id
  }
  if (booking.bay_number != null) {
    const byOrder = bays.find((b) => b.sort_order === booking.bay_number)
    if (byOrder) return byOrder.id
  }
  return null
}

export function groupBookingsByBay(
  bookings: CalendarBooking[],
  bays: BusinessBay[],
): Map<string, CalendarBooking[]> {
  const map = new Map<string, CalendarBooking[]>()
  for (const bay of bays) {
    map.set(bay.id, [])
  }
  for (const booking of bookings) {
    const bayId = resolveBookingBayId(booking, bays)
    if (bayId) {
      map.get(bayId)!.push(booking)
    }
  }
  return map
}
