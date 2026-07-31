import { addDays, format, parseISO, startOfMonth, endOfMonth, isBefore, isAfter, isSameDay, differenceInCalendarDays } from "date-fns"
import { ko } from "date-fns/locale"

/** KST calendar date as YYYY-MM-DD (browser local; CRM runs in Korea). */
export function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

export function parseIsoDate(iso: string): Date {
  return parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso)
}

export function todayIsoKst(): string {
  return toIsoDate(new Date())
}

export function tomorrowIso(): string {
  return toIsoDate(addDays(new Date(), 1))
}

/** Inclusive: today .. today+6 (7 days). */
export function next7DaysRange(from = new Date()): { from: string; to: string } {
  const start = from
  return { from: toIsoDate(start), to: toIsoDate(addDays(start, 6)) }
}

export function monthRange(year: number, monthIndex0: number): { from: string; to: string } {
  const first = startOfMonth(new Date(year, monthIndex0, 1))
  const last = endOfMonth(first)
  return { from: toIsoDate(first), to: toIsoDate(last) }
}

export type ScheduleFilter =
  | "today"
  | "tomorrow"
  | "next7"
  | "upcoming"
  | "date"
  | "calendar"
  | "past"

export function relativeBookingLabel(bookingDateIso: string, now = new Date()): string {
  const d = parseIsoDate(bookingDateIso)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = differenceInCalendarDays(target, today)
  if (diff === 0) return "오늘"
  if (diff === 1) return "내일"
  if (diff > 1 && diff <= 6) return `${diff}일 후`
  if (diff === -1) return "어제"
  return format(target, "M월 d일", { locale: ko })
}

/**
 * PG payment-hold waiting for online checkout.
 * ONSITE unpaid is NOT payment-pending — do not amber-highlight as 결제대기.
 */
export function isPaymentPending(
  status: string,
  paymentStatus?: string | null,
  paymentMethod?: string | null,
): boolean {
  const method = (paymentMethod ?? "").toLowerCase()
  if (method === "onsite") return false
  return (
    status.toLowerCase() === "pending" &&
    (paymentStatus ?? "unpaid").toLowerCase() === "unpaid"
  )
}

export function isConfirmedPaid(status: string, paymentStatus?: string | null): boolean {
  return status.toLowerCase() === "confirmed" && (paymentStatus ?? "").toLowerCase() === "paid"
}

/** Imminent: confirmed (+paid or onsite unpaid), today, start within next 60 minutes. */
export function isImminentBooking(opts: {
  bookingDate: string
  startTime: string
  status: string
  paymentStatus?: string | null
  paymentMethod?: string | null
  now?: Date
}): boolean {
  const confirmed = opts.status.toLowerCase() === "confirmed"
  const onsite = (opts.paymentMethod ?? "").toLowerCase() === "onsite"
  if (!confirmed) return false
  if (!onsite && !isConfirmedPaid(opts.status, opts.paymentStatus)) return false
  const now = opts.now ?? new Date()
  if (opts.bookingDate !== toIsoDate(now)) return false
  const [hh, mm] = opts.startTime.slice(0, 5).split(":").map(Number)
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return false
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0)
  const diffMs = start.getTime() - now.getTime()
  return diffMs >= 0 && diffMs <= 60 * 60 * 1000
}

export function imminentLabel(startTime: string, now = new Date()): string {
  const [hh, mm] = startTime.slice(0, 5).split(":").map(Number)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0)
  const mins = Math.round((start.getTime() - now.getTime()) / 60000)
  if (mins <= 0) return "곧 시작"
  if (mins <= 10) return "10분 전"
  if (mins <= 30) return "30분 전"
  return `${mins}분 전`
}

export function emptyStateCopy(filter: ScheduleFilter, selectedDate?: string): string {
  switch (filter) {
    case "today":
      return "오늘 예정된 예약이 없습니다."
    case "tomorrow":
      return "내일 예정된 예약이 없습니다."
    case "next7":
      return "향후 7일간 예정된 예약이 없습니다."
    case "upcoming":
      return "예정된 예약이 없습니다."
    case "date":
    case "calendar":
      return selectedDate
        ? `${relativeBookingLabel(selectedDate)}에 예약이 없습니다.`
        : "선택한 날짜에 예약이 없습니다."
    case "past":
      return "지난 예약이 없습니다."
    default:
      return "예약이 없습니다."
  }
}

export { addDays, format, isBefore, isAfter, isSameDay, startOfMonth, endOfMonth }
