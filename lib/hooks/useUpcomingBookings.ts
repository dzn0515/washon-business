import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchBusinessReservations, type ApiBooking } from "@/lib/bookings-api"
import { mapBookingStatus, mapPaymentStatus } from "@/lib/api-mappers"
import {
  imminentLabel,
  isImminentBooking,
  isPaymentPending,
  next7DaysRange,
  relativeBookingLabel,
  todayIsoKst,
  tomorrowIso,
} from "@/lib/booking-schedule"
import { isDemoMode } from "@/lib/demo-mode"
import type { BookingStatus, PaymentStatus } from "@/types"

export type UpcomingItem = {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  customer_name: string
  service_name: string
  bay_name: string | null
  car_number: string
  price: number
  status: BookingStatus
  payment_status: PaymentStatus
  payment_method?: "onsite" | "app" | "none"
  relative: string
  imminent: boolean
  imminentText?: string
}

function mapItem(b: ApiBooking, now: Date): UpcomingItem {
  const status = mapBookingStatus(b.status)
  const payment_status = mapPaymentStatus(b.payment_status ?? "unpaid")
  const imminent = isImminentBooking({
    bookingDate: b.booking_date.slice(0, 10),
    startTime: b.start_time,
    status,
    paymentStatus: payment_status,
    paymentMethod: b.payment_method,
    now,
  })
  return {
    id: String(b.id),
    booking_date: b.booking_date.slice(0, 10),
    start_time: b.start_time.slice(0, 5),
    end_time: b.end_time.slice(0, 5),
    customer_name: b.customer_name,
    service_name: b.menu_name ?? "메뉴",
    bay_name: b.bay_name,
    car_number: b.vehicle_number ?? "",
    price: b.price,
    status,
    payment_status,
    payment_method: b.payment_method,
    relative: relativeBookingLabel(b.booking_date.slice(0, 10), now),
    imminent,
    imminentText: imminent ? imminentLabel(b.start_time, now) : undefined,
  }
}

export function useUpcomingBookings(limit = 5) {
  const [items, setItems] = useState<UpcomingItem[]>([])
  const [counts, setCounts] = useState({ today: 0, tomorrow: 0, next7: 0, paymentPending: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDemo = isDemoMode()

  const load = useCallback(async () => {
    if (isDemo) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const today = todayIsoKst()
      const tomorrow = tomorrowIso()
      const week = next7DaysRange()
      const now = new Date()
      const [upcoming, todayRaw, tomorrowRaw, weekRaw, pendingRaw] = await Promise.all([
        fetchBusinessReservations({
          dateFrom: today,
          statuses: "pending,confirmed,arrived,in_progress",
          sort: "booking_datetime_asc",
          limit: 20,
        }),
        fetchBusinessReservations({ bookingDate: today }),
        fetchBusinessReservations({ bookingDate: tomorrow }),
        fetchBusinessReservations({ dateFrom: week.from, dateTo: week.to }),
        fetchBusinessReservations({
          dateFrom: today,
          statuses: "pending",
          paymentStatuses: "unpaid",
          limit: 50,
        }),
      ])
      const terminal = new Set([
        "cancelled",
        "expired",
        "completed",
        "noshow",
        "CANCELLED",
        "EXPIRED",
        "COMPLETED",
        "NOSHOW",
      ])
      const filtered = upcoming
        .filter((b) => b.source !== "block")
        .filter((b) => !terminal.has(b.status))
        .slice(0, limit)
        .map((b) => mapItem(b, now))
      setItems(filtered)
      setCounts({
        today: todayRaw.filter((b) => b.source !== "block").length,
        tomorrow: tomorrowRaw.filter((b) => b.source !== "block").length,
        next7: weekRaw.filter((b) => b.source !== "block").length,
        paymentPending: pendingRaw.filter(
          (b) =>
            isPaymentPending(b.status, b.payment_status, b.payment_method) &&
            b.source !== "block",
        ).length,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isDemo, limit])

  useEffect(() => {
    void load()
  }, [load])

  const imminent = useMemo(() => items.filter((i) => i.imminent), [items])

  return { items, imminent, counts, loading, error, refetch: load }
}
