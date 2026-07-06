import type { ReservationSource } from '@/lib/bookings-api'

export const RESERVATION_SOURCE_LABEL: Record<ReservationSource, string> = {
  app: '앱 예약',
  local: '로컬 예약',
  block: '시간 차단',
}

export const RESERVATION_SOURCE_STYLE: Record<ReservationSource, string> = {
  app: 'bg-emerald-100 text-emerald-700',
  local: 'bg-blue-100 text-blue-700',
  block: 'bg-gray-200 text-gray-700',
}

export function normalizeReservationSource(raw?: string | null): ReservationSource {
  if (raw === 'local' || raw === 'block') return raw
  return 'app'
}
