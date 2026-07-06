import type { ApiBooking, ApiMenu } from '@/lib/bookings-api'
import type { BookingReminderAlert, ReminderStage } from '@/lib/booking-reminder/types'
import { todayIso } from '@/lib/api-mappers'
import type { BookingStatus } from '@/types'

const ACTIVE_STATUSES: BookingStatus[] = ['pending', 'waiting', 'confirmed', 'arrived']

const STAGE_THRESHOLDS: { stage: ReminderStage; minExclusive: number; maxInclusive: number }[] = [
  { stage: '30min', minExclusive: 29, maxInclusive: 30 },
  { stage: '10min', minExclusive: 9, maxInclusive: 10 },
  { stage: 'at_time', minExclusive: -1, maxInclusive: 0 },
]

export function parseLicensePlate(vehicleModel: string | null): string {
  if (!vehicleModel?.trim()) return '미등록'
  const match = vehicleModel.match(/\(([^)]+)\)/)
  if (match) return match[1].trim()
  return vehicleModel.trim()
}

export function parseBookingDateTime(bookingDate: string, startTime: string): Date {
  const time = startTime.slice(0, 5)
  return new Date(`${bookingDate}T${time}:00`)
}

export function minutesUntilBooking(bookingDate: string, startTime: string, now = new Date()): number {
  const target = parseBookingDateTime(bookingDate, startTime)
  return (target.getTime() - now.getTime()) / 60_000
}

export function isActiveBookingStatus(status: string): boolean {
  return ACTIVE_STATUSES.includes(status.toLowerCase() as BookingStatus)
}

export function detectReminderStage(
  bookingDate: string,
  startTime: string,
  now = new Date(),
): ReminderStage | null {
  if (bookingDate !== todayIso()) return null
  const minutes = minutesUntilBooking(bookingDate, startTime, now)
  for (const { stage, minExclusive, maxInclusive } of STAGE_THRESHOLDS) {
    if (minutes <= maxInclusive && minutes > minExclusive) return stage
  }
  return null
}

function buildVoiceText(
  stage: ReminderStage,
  customerName: string,
  carNumber: string,
  serviceName: string,
): string {
  const prefix =
    stage === '30min'
      ? '30분 후 예약이 있습니다.'
      : stage === '10min'
        ? '10분 후 예약이 있습니다.'
        : '예약 시간입니다.'
  return `${prefix} ${customerName} 고객님, 차량번호 ${carNumber}, ${serviceName} 예약입니다.`
}

export function buildReminderAlert(
  booking: ApiBooking,
  menuMap: Record<string, ApiMenu>,
  stage: ReminderStage,
): BookingReminderAlert {
  const carNumber = parseLicensePlate(booking.vehicle_model)
  const serviceName =
    (booking.menu_id ? menuMap[booking.menu_id]?.name : null) ?? booking.menu_name ?? '서비스'
  const bookingTime = booking.start_time.slice(0, 5)
  const voiceText = buildVoiceText(stage, booking.customer_name, carNumber, serviceName)

  return {
    id: `${booking.id}-${stage}-${booking.booking_date}`,
    bookingId: booking.id,
    stage,
    customerName: booking.customer_name,
    carNumber,
    serviceName,
    bookingTime,
    bookingDate: booking.booking_date,
    voiceText,
  }
}
