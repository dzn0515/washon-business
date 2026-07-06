import { mapBookingStatus, todayIso } from '@/lib/api-mappers'
import type { ApiBooking } from '@/lib/bookings-api'
import type { DashboardTodayBooking, DashboardTodayData } from '@/lib/hooks/useDashboardToday'
import type { BookingStatus } from '@/types'
import { formatResourceName } from '@/lib/resource-label'

const EXCLUDED_REVENUE = new Set<BookingStatus>(['cancelled', 'noshow'])
const CURRENT_STATUSES = new Set<BookingStatus>(['in_progress', 'arrived'])
const NEXT_STATUSES = new Set<BookingStatus>(['confirmed', 'pending', 'waiting'])

const STAFF_COLORS = ['#2563EB', '#16A34A', '#D97706', '#9333EA', '#E11D48', '#0891B2', '#64748B']

function countBucket(status: BookingStatus): keyof DashboardTodayData['status_counts'] | null {
  if (status === 'pending' || status === 'waiting') return 'pending'
  if (status === 'confirmed') return 'confirmed'
  if (status === 'in_progress' || status === 'arrived') return 'in_progress'
  if (status === 'completed' || status === 'paid' || status === 'reviewed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'noshow') return 'noshow'
  return null
}

function staffColor(staffId: string): string {
  const n = Number.parseInt(staffId, 10)
  if (Number.isNaN(n)) return STAFF_COLORS[0]
  return STAFF_COLORS[n % STAFF_COLORS.length]
}

function toDashboardBooking(
  b: ApiBooking,
  menuNames: Map<string, string>,
  bizType?: string | null,
): DashboardTodayBooking {
  return {
    id: b.id,
    booking_number: b.booking_number,
    customer_name: b.customer_name,
    service_name: (b.menu_id ? menuNames.get(b.menu_id) : null) ?? b.menu_name ?? '예약 메뉴',
    start_time: b.start_time.slice(0, 5),
    end_time: b.end_time.slice(0, 5),
    status: mapBookingStatus(b.status),
    bay_id: b.bay_id,
    bay_name: b.bay_name ?? (b.bay_number ? formatResourceName(bizType, b.bay_number) : null),
    staff_id: b.staff_id,
    staff_name: b.staff_name,
    price: b.price,
  }
}

function nowTimeLabel(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function buildDashboardTodayFromBookings(
  bookings: ApiBooking[],
  options: { bayCount: number; date?: string; menuNames?: Map<string, string>; bizType?: string | null },
): DashboardTodayData {
  const date = options.date ?? todayIso()
  const menuNames = options.menuNames ?? new Map<string, string>()
  const bayCount = Math.max(options.bayCount, 1)
  const nowTime = nowTimeLabel()

  const status_counts: DashboardTodayData['status_counts'] = {
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    noshow: 0,
  }

  let expected_revenue = 0
  const staffAssigned = new Map<string, { name: string; count: number }>()
  let unassigned = 0
  const busyBays = new Set<number>()

  for (const raw of bookings) {
    const status = mapBookingStatus(raw.status)
    const bucket = countBucket(status)
    if (bucket) status_counts[bucket] += 1
    if (!EXCLUDED_REVENUE.has(status)) expected_revenue += raw.price
    if (CURRENT_STATUSES.has(status) && raw.bay_number) busyBays.add(raw.bay_number)

    if (raw.staff_id) {
      const prev = staffAssigned.get(raw.staff_id)
      staffAssigned.set(raw.staff_id, {
        name: raw.staff_name ?? '직원',
        count: (prev?.count ?? 0) + 1,
      })
    } else {
      unassigned += 1
    }
  }

  const staff_summary: DashboardTodayData['staff_summary'] = Array.from(staffAssigned.entries()).map(
    ([staff_id, { name, count }]) => ({
      staff_id,
      name,
      color: staffColor(staff_id),
      assigned_count: count,
      active: true,
    }),
  )
  if (unassigned > 0) {
    staff_summary.push({
      staff_id: null,
      name: '미배정',
      color: '#94A3B8',
      assigned_count: unassigned,
      active: true,
    })
  }

  const mapped = bookings.map((b) => toDashboardBooking(b, menuNames, options.bizType))

  return {
    date,
    total_bookings: bookings.length,
    status_counts,
    expected_revenue,
    bay_summary: {
      total: bayCount,
      active: bayCount,
      busy_now: busyBays.size,
      available_now: Math.max(bayCount - busyBays.size, 0),
    },
    staff_summary,
    current_bookings: mapped.filter((b) => CURRENT_STATUSES.has(b.status)),
    next_bookings: mapped
      .filter((b) => NEXT_STATUSES.has(b.status) && b.start_time > nowTime)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }
}
