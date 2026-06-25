import type { BookingStatus, CustomerGrade } from '@/types'
import { calcPriceGrid, type PriceGrid } from '@/lib/dashboard-ui'

export function mapBookingStatus(status: string): BookingStatus {
  const map: Record<string, BookingStatus> = {
    pending: 'PENDING',
    confirmed: 'CONFIRMED',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
    noshow: 'NO_SHOW',
  }
  return map[status.toLowerCase()] ?? 'PENDING'
}

export function mapCustomerGrade(grade: string): CustomerGrade {
  const map: Record<string, CustomerGrade> = {
    new: 'NORMAL',
    regular: 'GOLD',
    vip: 'VIP',
  }
  return map[grade.toLowerCase()] ?? 'NORMAL'
}

export function mapApiGradeFilter(filter: string): string | undefined {
  const map: Record<string, string> = {
    VIP: 'vip',
    REGULAR: 'regular',
    NEW: 'new',
  }
  return map[filter]
}

export function pricesToGrid(
  prices: { vehicle_size: string; vehicle_origin: string; price: number }[],
): PriceGrid {
  const grid = calcPriceGrid(
    prices.find((p) => p.vehicle_origin === 'domestic' && p.vehicle_size === 'small')?.price ?? 25000,
  )
  for (const p of prices) {
    const origin = p.vehicle_origin === 'imported' ? 'import' : 'domestic'
    const key = `${origin}_${p.vehicle_size}` as keyof PriceGrid
    if (key in grid) grid[key] = p.price
  }
  return grid
}

export function formatDateLabel(d = new Date()): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const w = days[d.getDay()]
  return `${y}년 ${m}월 ${day}일 (${w})`
}

export function todayIso(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60_000)
  return local.toISOString().slice(0, 10)
}
