'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import { fetchBusinessBookings, type ApiBooking } from '@/lib/bookings-api'
import { fetchCustomers, type ApiCustomer } from '@/lib/customers-api'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import { resolveResourceLabel } from '@/lib/resource-label'
import { demoAiInsights } from '@/lib/demo-data'
import { todayIso } from '@/lib/api-mappers'
import {
  INSIGHT_CATALOG,
  comingSoonInsight,
  computeLongAbsentCustomers,
  computePeakTimeSlot,
  computeReviewRequestTargets,
  computeRevisitTargets,
  computeTodayPeakTimeSlot,
  computeWeeklyBookingChange,
  lastNDates,
  type OperationalInsight,
} from '@/lib/operational-insights'

function mapDemoInsights(): OperationalInsight[] {
  return demoAiInsights.map((d) => ({
    id: d.id,
    type: d.type,
    title: d.title,
    summary: d.summary,
    metric: d.metric,
    action: d.action,
    priority: d.priority,
    status: 'live' as const,
  }))
}

async function fetchBookingsForDates(dates: string[]): Promise<ApiBooking[]> {
  const batches = await Promise.all(dates.map((d) => fetchBusinessBookings(d)))
  return batches.flat()
}

function mergeInsights(
  bookingsLive: boolean,
  customersLive: boolean,
  todayBookings: ApiBooking[],
  thisWeekBookings: ApiBooking[],
  lastWeekBookings: ApiBooking[],
  recentBookings: ApiBooking[],
  customers: ApiCustomer[],
  resourceLabel: string,
): OperationalInsight[] {
  const liveById = new Map<string, OperationalInsight>()

  if (bookingsLive) {
    const peakToday = computeTodayPeakTimeSlot(todayBookings, resourceLabel)
    const peak = peakToday ?? computePeakTimeSlot(thisWeekBookings, resourceLabel)
    if (peak) liveById.set(peak.id, peak)

    const weekly = computeWeeklyBookingChange(thisWeekBookings, lastWeekBookings)
    if (weekly) liveById.set(weekly.id, weekly)

    const review = computeReviewRequestTargets(recentBookings)
    if (review) liveById.set(review.id, review)
  }

  if (customersLive) {
    const absent = computeLongAbsentCustomers(customers)
    if (absent) liveById.set(absent.id, absent)

    const revisit = computeRevisitTargets(customers)
    if (revisit) liveById.set(revisit.id, revisit)
  }

  return INSIGHT_CATALOG.map((item) => {
    const live = liveById.get(item.id)
    if (live) return live

    const bookingsNeeded = ['peak-time-slot', 'weekly-booking-change', 'review-request-targets'].includes(
      item.id,
    )
    const customersNeeded = ['long-absent-customers', 'revisit-targets'].includes(item.id)

    if (bookingsNeeded && !bookingsLive) {
      return comingSoonInsight(item.id, item.type, item.title, item.reason)
    }
    if (customersNeeded && !customersLive) {
      return comingSoonInsight(item.id, item.type, item.title, item.reason)
    }

    return comingSoonInsight(
      item.id,
      item.type,
      item.title,
      bookingsLive || customersLive
        ? '현재 조건에 해당하는 데이터가 없습니다.'
        : item.reason,
    )
  })
}

export function useOperationalInsights() {
  const { isDemo } = useDemoMode()
  const { display: businessDisplay } = useBusinessMe()
  const resourceLabel = resolveResourceLabel(
    businessDisplay?.bizType,
    businessDisplay?.resourceLabel,
  )
  const [insights, setInsights] = useState<OperationalInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingsLive, setBookingsLive] = useState(false)
  const [customersLive, setCustomersLive] = useState(false)

  const load = useCallback(async () => {
    if (isDemo) {
      setInsights(mapDemoInsights())
      setBookingsLive(false)
      setCustomersLive(false)
      setLoading(false)
      return
    }

    setLoading(true)
    let liveBookings: ApiBooking[] | null = null
    let liveCustomers: ApiCustomer[] | null = null

    const thisWeekDates = lastNDates(7, 0)
    const lastWeekDates = lastNDates(7, -7)
    const recentDates = lastNDates(14, 0)

    try {
      liveBookings = await fetchBookingsForDates(thisWeekDates)
      setBookingsLive(true)
    } catch {
      setBookingsLive(false)
    }

    try {
      const customerPage = await fetchCustomers({ page: 1, pageSize: 200 })
      liveCustomers = customerPage.items
      setCustomersLive(true)
    } catch {
      setCustomersLive(false)
    }

    let thisWeek: ApiBooking[] = []
    let lastWeek: ApiBooking[] = []
    let recent: ApiBooking[] = []
    let todayOnly: ApiBooking[] = []

    if (liveBookings) {
      thisWeek = liveBookings
      try {
        todayOnly = await fetchBusinessBookings(todayIso())
      } catch {
        todayOnly = []
      }
      try {
        lastWeek = await fetchBookingsForDates(lastWeekDates)
      } catch {
        lastWeek = []
      }
      try {
        recent = await fetchBookingsForDates(recentDates)
      } catch {
        recent = thisWeek
      }
    }

    setInsights(
      mergeInsights(
        liveBookings !== null,
        liveCustomers !== null,
        todayOnly,
        thisWeek,
        lastWeek,
        recent,
        liveCustomers ?? [],
        resourceLabel,
      ),
    )
    setLoading(false)
  }, [isDemo, resourceLabel])

  useEffect(() => {
    void load()
  }, [load])

  const liveCount = insights.filter((i) => i.status === 'live').length

  return {
    insights,
    loading,
    isLive: !isDemo && (bookingsLive || customersLive),
    bookingsLive: !isDemo && bookingsLive,
    customersLive: !isDemo && customersLive,
    liveCount,
    refetch: load,
    isDemo,
  }
}
