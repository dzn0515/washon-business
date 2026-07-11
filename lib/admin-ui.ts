import { BOOKING_STATUS_MAP, type BookingStatus } from '@/types'
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS } from '@/lib/business-types'

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

/** 입점심사 화면 — ACTIVE는 승인완료로 표시 */
export const PARTNER_ADMISSION_STATUS_LABEL: Record<string, string> = {
  pending: '승인대기',
  active: '승인완료',
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
  ...BUSINESS_TYPE_LABELS,
}

export const ADMIN_BIZ_TYPE_FILTERS = [
  { key: 'all', label: '전체 업종' },
  ...BUSINESS_TYPES.map(({ code, label }) => ({ key: code, label })),
] as const

export type AdminBizTypeFilterKey = (typeof ADMIN_BIZ_TYPE_FILTERS)[number]['key']

export function getAdminBizTypeLabel(bizType: string): string {
  return ADMIN_BIZ_TYPE_LABEL[bizType] ?? bizType
}

/** Admin 쿠폰 모니터링 */
export const ADMIN_COUPON_SOURCE_LABEL: Record<string, string> = {
  manual: '수동',
  birthday_auto: '생일자동',
}

export const ADMIN_COUPON_STATUS_LABEL: Record<string, string> = {
  issued: '발급',
  used: '사용',
  expired: '만료',
  cancelled: '취소',
}

export function formatAdminCouponDiscount(type: string, value: number): string {
  if (type === 'percent') return `${value}%`
  return `${value.toLocaleString('ko-KR')}원`
}

export function formatAdminCouponDateRange(from: string, until: string): string {
  const a = from?.slice(0, 10) || '-'
  const b = until?.slice(0, 10) || '-'
  return `${a} ~ ${b}`
}

/** Admin 배너 CMS */
export const ADMIN_BANNER_STATUS_LABEL: Record<string, string> = {
  DRAFT: '임시저장',
  SCHEDULED: '예정',
  ACTIVE: '활성',
  PAUSED: '일시정지',
  ENDED: '종료',
}

export const ADMIN_BANNER_PLACEMENT_LABEL: Record<string, string> = {
  HOME_TOP: '홈 상단',
  CATEGORY_LIST: '카테고리 목록',
  STORE_DETAIL: '매장 상세',
  EVENT: '이벤트',
  WEB_MAIN: '웹 메인',
}

export const ADMIN_BANNER_LINK_TYPE_LABEL: Record<string, string> = {
  STORE: '매장 이동',
  EXTERNAL_URL: '외부 링크',
  NONE: '링크 없음',
}

export function formatAdminBannerDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  } catch {
    return iso
  }
}

export function formatAdminBannerPeriod(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
): string {
  return `${formatAdminBannerDateTime(startAt)} ~ ${formatAdminBannerDateTime(endAt)}`
}
