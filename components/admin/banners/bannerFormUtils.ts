import type { BannerLinkType, BannerPlacement, BannerStatus } from '@/lib/admin-api'

export const BANNER_PLACEMENTS: { value: BannerPlacement; label: string }[] = [
  { value: 'HOME_TOP', label: '홈 상단' },
  { value: 'CATEGORY_LIST', label: '카테고리 목록' },
  { value: 'STORE_DETAIL', label: '매장 상세' },
  { value: 'EVENT', label: '이벤트' },
  { value: 'WEB_MAIN', label: '웹 메인' },
]

export const BANNER_LINK_TYPES: { value: BannerLinkType; label: string }[] = [
  { value: 'NONE', label: '링크 없음' },
  { value: 'STORE', label: '매장 이동' },
  { value: 'EXTERNAL_URL', label: '외부 링크' },
]

export const BANNER_STATUSES: { value: BannerStatus; label: string }[] = [
  { value: 'DRAFT', label: '임시저장' },
  { value: 'SCHEDULED', label: '예정' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'PAUSED', label: '일시정지' },
  { value: 'ENDED', label: '종료' },
]

export const MAX_BANNER_IMAGE_BYTES = 5 * 1024 * 1024
export const ALLOWED_BANNER_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export type BannerFormState = {
  title: string
  subtitle: string
  placement: BannerPlacement
  linkType: BannerLinkType
  linkValue: string
  partnerId: string
  startAt: string
  endAt: string
  displayOrder: string
}

export const EMPTY_BANNER_FORM: BannerFormState = {
  title: '',
  subtitle: '',
  placement: 'HOME_TOP',
  linkType: 'NONE',
  linkValue: '',
  partnerId: '',
  startAt: '',
  endAt: '',
  displayOrder: '0',
}

/** API ISO → datetime-local (브라우저 로컬) */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** datetime-local → API 전송용 naive datetime 문자열 */
export function fromDatetimeLocalValue(local: string): string | null {
  const v = local.trim()
  if (!v) return null
  return v.length === 16 ? `${v}:00` : v
}

export function validateExternalUrl(url: string): string | null {
  const t = url.trim()
  if (!t) return '외부 링크 URL을 입력하세요.'
  try {
    const u = new URL(t)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return 'URL은 http:// 또는 https:// 로 시작해야 합니다.'
    }
    return null
  } catch {
    return '올바른 URL 형식이 아닙니다.'
  }
}

export function validateBannerImageFile(file: File): string | null {
  const type = (file.type || '').toLowerCase()
  if (!ALLOWED_BANNER_MIME.has(type)) {
    return 'JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.'
  }
  if (file.size > MAX_BANNER_IMAGE_BYTES) {
    return '이미지 크기는 최대 5MB까지 가능합니다.'
  }
  return null
}

export function canActivateBanner(opts: {
  imageUrl: string | null | undefined
  startAt: string | null | undefined
  endAt: string | null | undefined
}): string | null {
  if (!opts.imageUrl) return 'ACTIVE/SCHEDULED 전환 전 이미지가 필요합니다.'
  if (!opts.startAt || !opts.endAt) return 'ACTIVE/SCHEDULED 전환 전 노출 기간이 필요합니다.'
  if (new Date(opts.startAt).getTime() >= new Date(opts.endAt).getTime()) {
    return '시작 시각은 종료 시각보다 앞서야 합니다.'
  }
  return null
}

export function statusActionsFor(current: string): { status: BannerStatus; label: string }[] {
  switch (current) {
    case 'DRAFT':
      return [
        { status: 'SCHEDULED', label: '예약' },
        { status: 'ACTIVE', label: '활성화' },
      ]
    case 'SCHEDULED':
      return [
        { status: 'ACTIVE', label: '활성화' },
        { status: 'PAUSED', label: '일시정지' },
        { status: 'ENDED', label: '종료' },
      ]
    case 'ACTIVE':
      return [
        { status: 'PAUSED', label: '일시정지' },
        { status: 'ENDED', label: '종료' },
      ]
    case 'PAUSED':
      return [
        { status: 'ACTIVE', label: '활성화' },
        { status: 'ENDED', label: '종료' },
      ]
    case 'ENDED':
      return [{ status: 'DRAFT', label: '임시저장으로' }]
    default:
      return [
        { status: 'DRAFT', label: '임시저장' },
        { status: 'ACTIVE', label: '활성화' },
      ]
  }
}
