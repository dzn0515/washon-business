import { BOOKING_STATUS_MAP, type BookingStatus } from '@/types'

const CANDIDATE_TIMELINE: BookingStatus[] = [
  'pending',
  'confirmed',
  'arrived',
  'in_progress',
  'completed',
  'paid',
]

/** Main booking flow — keys must exist in BOOKING_STATUS_MAP (no hardcoded new statuses) */
export const BOOKING_TIMELINE_STEPS = CANDIDATE_TIMELINE.filter((s) => s in BOOKING_STATUS_MAP)

export function getTimelineStepIndex(status: string): number {
  const normalized = status.toLowerCase() as BookingStatus
  const idx = BOOKING_TIMELINE_STEPS.indexOf(normalized)
  if (idx >= 0) return idx
  if (normalized === 'waiting') return 0
  if (normalized === 'reviewed') return BOOKING_TIMELINE_STEPS.length
  if (normalized === 'cancelled' || normalized === 'noshow') return -1
  return -1
}

export const RESERVATION_SOURCE_LABEL: Record<string, string> = {
  app: '📱 앱',
  qr: '🔗 QR',
  phone: '📞 전화',
  admin: '🖥️ 관리자',
}

export const BUSINESS_STATUS_LABEL: Record<string, string> = {
  pending: '승인대기',
  active: '운영중',
  inactive: '비활성',
  suspended: '정지',
  rejected: '거절',
}

export const BUSINESS_STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  pending: 'warning',
  active: 'success',
  inactive: 'neutral',
  suspended: 'error',
  rejected: 'error',
}

export const HEALTH_STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
}

export const HEALTH_STATUS_LABEL: Record<string, string> = {
  healthy: '정상',
  degraded: '저하',
  down: '장애',
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}일 ${hours}시간 ${minutes}분`
}

export function formatKoreaDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  } catch {
    return iso
  }
}

export function roundCommissionRate(value: number): number {
  return Math.round(value * 10) / 10
}

/** Admin 업체관리 — 업종 코드 → 한글 라벨 */
export const ADMIN_BIZ_TYPE_LABEL: Record<string, string> = {
  wash: '세차',
  detailing: '디테일링',
  polish: '광택',
  coating: '유리막',
  tire: '타이어',
  oil: '엔진오일',
  repair: '정비',
  audio: '블랙박스/카오디오',
  tinting: '썬팅',
  dent: '덴트',
  glass: '유리복원',
  other: '기타',
}

export const ADMIN_BIZ_TYPE_FILTERS = [
  { key: 'all', label: '전체 업종' },
  { key: 'wash', label: '세차' },
  { key: 'detailing', label: '디테일링' },
  { key: 'polish', label: '광택' },
  { key: 'coating', label: '유리막' },
  { key: 'tire', label: '타이어' },
  { key: 'oil', label: '엔진오일' },
  { key: 'repair', label: '정비' },
  { key: 'audio', label: '블랙박스/카오디오' },
  { key: 'tinting', label: '썬팅' },
  { key: 'dent', label: '덴트' },
  { key: 'glass', label: '유리복원' },
  { key: 'other', label: '기타' },
] as const

export type AdminBizTypeFilterKey = (typeof ADMIN_BIZ_TYPE_FILTERS)[number]['key']

export function getAdminBizTypeLabel(bizType: string): string {
  return ADMIN_BIZ_TYPE_LABEL[bizType] ?? bizType
}
