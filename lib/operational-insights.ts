import type { ApiBooking } from '@/lib/bookings-api'
import type { ApiCustomer } from '@/lib/customers-api'

export type InsightType = 'booking' | 'customer' | 'revenue' | 'staff'

export type OperationalInsight = {
  id: string
  type: InsightType
  title: string
  summary: string
  metric?: string
  action?: string
  priority: 'high' | 'medium' | 'low'
  status: 'live' | 'coming_soon'
}

const COUNTABLE = new Set([
  'pending',
  'waiting',
  'confirmed',
  'arrived',
  'in_progress',
  'completed',
  'paid',
  'reviewed',
])

const REVIEW_PENDING = new Set(['completed', 'paid'])

export function isoDateOffset(days: number, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60_000)
  return local.toISOString().slice(0, 10)
}

export function lastNDates(n: number, endOffset = 0): string[] {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i -= 1) {
    dates.push(isoDateOffset(-i + endOffset))
  }
  return dates
}

function isCountableBooking(b: ApiBooking): boolean {
  return COUNTABLE.has(b.status)
}

function parseHour(startTime: string): number {
  return Number.parseInt(startTime.slice(0, 2), 10)
}

function findPeakHour(bookings: ApiBooking[]) {
  const byHour = new Map<number, number>()
  for (const b of bookings) {
    const h = parseHour(b.start_time)
    byHour.set(h, (byHour.get(h) ?? 0) + 1)
  }

  let peakHour = 0
  let peakCount = 0
  for (const [hour, count] of Array.from(byHour.entries())) {
    if (count > peakCount) {
      peakHour = hour
      peakCount = count
    }
  }

  return { peakHour, peakCount, endHour: peakHour + 1 }
}

/** 오늘 예약 기준 시간대 몰림 (룰: 2건 이상 & 35% 이상) */
export function computeTodayPeakTimeSlot(
  bookings: ApiBooking[],
  resourceLabel = '작업공간',
): OperationalInsight | null {
  const active = bookings.filter(isCountableBooking)
  if (active.length < 2) return null

  const { peakHour, peakCount, endHour } = findPeakHour(active)
  const pct = Math.round((peakCount / active.length) * 100)
  if (peakCount < 2 || pct < 35) return null

  return {
    id: 'peak-time-slot',
    type: 'booking',
    title: '오늘 예약 시간대 몰림',
    summary: `오늘 예약 ${active.length}건 중 ${peakHour}–${endHour}시에 ${peakCount}건(${pct}%)이 몰려 있습니다. 인력·${resourceLabel} 배치를 확인하세요.`,
    metric: `${peakHour}–${endHour}시`,
    action: '예약 캘린더 확인',
    priority: pct >= 50 ? 'high' : 'medium',
    status: 'live',
  }
}

export function computePeakTimeSlot(
  bookings: ApiBooking[],
  resourceLabel = '작업공간',
): OperationalInsight | null {
  const active = bookings.filter(isCountableBooking)
  if (active.length === 0) return null

  const { peakHour, peakCount, endHour } = findPeakHour(active)
  const pct = Math.round((peakCount / active.length) * 100)

  return {
    id: 'peak-time-slot',
    type: 'booking',
    title: '시간대 예약 몰림',
    summary: `최근 7일 예약 ${active.length}건 중 ${peakHour}–${endHour}시대가 ${pct}%를 차지합니다. 인력·${resourceLabel} 배치를 참고하세요.`,
    metric: `${pct}%`,
    action: '예약 캘린더 확인',
    priority: peakCount >= 5 ? 'high' : 'medium',
    status: 'live',
  }
}

export function computeWeeklyBookingChange(
  thisWeek: ApiBooking[],
  lastWeek: ApiBooking[],
): OperationalInsight | null {
  const thisCount = thisWeek.filter(isCountableBooking).length
  const lastCount = lastWeek.filter(isCountableBooking).length

  if (thisCount === 0 && lastCount === 0) return null

  let changeLabel: string
  let summary: string
  if (lastCount === 0) {
    changeLabel = `${thisCount}건`
    summary = `이번 주 예약 ${thisCount}건입니다. 지난주 데이터가 없어 증감 비교는 다음 주부터 표시됩니다.`
  } else {
    const pct = Math.round(((thisCount - lastCount) / lastCount) * 100)
    const sign = pct > 0 ? '+' : ''
    changeLabel = `${sign}${pct}%`
    const direction = pct > 0 ? '증가' : pct < 0 ? '감소' : '유지'
    summary = `이번 주 ${thisCount}건, 지난주 ${lastCount}건입니다. 이번 주 예약률이 지난주보다 ${direction}했습니다.`
  }

  const weeklyTitle =
    lastCount === 0
      ? '주간 예약 현황'
      : thisCount > lastCount
        ? '이번 주 예약률 증가'
        : thisCount < lastCount
          ? '이번 주 예약률 감소'
          : '이번 주 예약률 유지'

  return {
    id: 'weekly-booking-change',
    type: 'booking',
    title: weeklyTitle,
    summary,
    metric: changeLabel,
    action: '예약 목록 보기',
    priority: 'medium',
    status: 'live',
  }
}

export function computeLongAbsentCustomers(customers: ApiCustomer[]): OperationalInsight | null {
  const now = Date.now()
  const thresholdMs = 30 * 24 * 60 * 60 * 1000
  const absent = customers.filter((c) => {
    if (!c.last_visit_at || c.visit_count < 1) return false
    const last = new Date(c.last_visit_at).getTime()
    return now - last >= thresholdMs
  })

  if (absent.length === 0) return null

  return {
    id: 'long-absent-customers',
    type: 'customer',
    title: '장기 미방문 고객',
    summary: `최근 30일 이상 방문하지 않은 고객 ${absent.length}명이 있습니다. 쿠폰·알림으로 재방문을 유도할 수 있습니다.`,
    metric: `${absent.length}명`,
    action: '고객 목록 보기',
    priority: absent.length >= 5 ? 'high' : 'medium',
    status: 'live',
  }
}

export function computeRevisitTargets(customers: ApiCustomer[]): OperationalInsight | null {
  const now = Date.now()
  const minMs = 30 * 24 * 60 * 60 * 1000
  const maxMs = 90 * 24 * 60 * 60 * 1000
  const targets = customers.filter((c) => {
    if (!c.last_visit_at || c.visit_count < 2) return false
    const elapsed = now - new Date(c.last_visit_at).getTime()
    return elapsed >= minMs && elapsed <= maxMs
  })

  if (targets.length === 0) return null

  return {
    id: 'revisit-targets',
    type: 'customer',
    title: '재방문 알림 대상',
    summary: `2회 이상 방문한 단골 중 30–90일 미방문 고객 ${targets.length}명이 있습니다. 재방문 알림·쿠폰 발송을 검토하세요.`,
    metric: `${targets.length}명`,
    action: '고객 목록 보기',
    priority: 'medium',
    status: 'live',
  }
}

export function computeReviewRequestTargets(bookings: ApiBooking[]): OperationalInsight | null {
  const targets = bookings.filter((b) => REVIEW_PENDING.has(b.status))
  if (targets.length === 0) return null

  return {
    id: 'review-request-targets',
    type: 'customer',
    title: '리뷰 요청 대상',
    summary: `완료·결제 후 리뷰가 작성되지 않은 예약 ${targets.length}건이 있습니다. 고객에게 리뷰 작성을 안내할 수 있습니다.`,
    metric: `${targets.length}건`,
    action: '예약 목록 보기',
    priority: targets.length >= 3 ? 'high' : 'medium',
    status: 'live',
  }
}

export function comingSoonInsight(
  id: string,
  type: InsightType,
  title: string,
  reason: string,
): OperationalInsight {
  return {
    id,
    type,
    title,
    summary: reason,
    priority: 'low',
    status: 'coming_soon',
  }
}

export const INSIGHT_CATALOG: { id: string; type: InsightType; title: string; reason: string }[] = [
  {
    id: 'peak-time-slot',
    type: 'booking',
    title: '시간대 예약 몰림',
    reason: '예약 API 연동 후 시간대별 집계가 표시됩니다.',
  },
  {
    id: 'long-absent-customers',
    type: 'customer',
    title: '장기 미방문 고객',
    reason: '고객 API(last_visit_at) 연동 후 표시됩니다.',
  },
  {
    id: 'review-request-targets',
    type: 'customer',
    title: '리뷰 요청 대상',
    reason: '예약 API 연동 후 완료·미리뷰 건수가 표시됩니다.',
  },
  {
    id: 'revisit-targets',
    type: 'customer',
    title: '재방문 알림 대상',
    reason: '고객 API(방문 이력) 연동 후 표시됩니다.',
  },
  {
    id: 'weekly-booking-change',
    type: 'booking',
    title: '주간 예약 증감',
    reason: '예약 API 연동 후 이번 주·지난주 비교가 표시됩니다.',
  },
]
