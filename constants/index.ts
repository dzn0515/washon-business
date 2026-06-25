import type { BookingStatus, CustomerGrade, ServiceTypeCode } from '@/types'

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: '대기',
  CONFIRMED: '확정',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  NO_SHOW: '노쇼',
}

export const BOOKING_STATUS_STYLE: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-red-900 text-white',
}

export const CUSTOMER_GRADE_LABEL: Record<CustomerGrade, string> = {
  NORMAL: '일반',
  SILVER: '실버',
  GOLD: '골드',
  VIP: 'VIP',
}

export const CUSTOMER_GRADE_STYLE: Record<CustomerGrade, string> = {
  NORMAL: 'bg-gray-100 text-gray-800',
  SILVER: 'bg-gray-200 text-gray-700',
  GOLD: 'bg-yellow-100 text-yellow-800',
  VIP: 'bg-purple-100 text-purple-800',
}

export const SERVICE_TYPE_LABEL: Record<ServiceTypeCode, string> = {
  CAR_WASH: '세차',
  DETAILING: '디테일링',
  COATING: '코팅',
  TINTING: '썬팅',
  POLISH: '광택',
  WASH_SUBSCRIPTION: '세차 구독',
  TIRE: '타이어',
  WHEEL: '휠',
  ALIGNMENT: '얼라인먼트',
  OIL_CHANGE: '오일교환',
  REPAIR: '정비',
  INSPECTION: '점검',
  BATTERY: '배터리',
  AIRCON: '에어컨',
  USED_CAR_INSPECTION: '중고차 점검',
  BLACKBOX: '블랙박스',
  CAR_AUDIO: '카오디오',
  ELECTRIC: '전기차',
  CAR_GLASS: '유리',
  EMERGENCY_ROADSIDE: '긴급출동',
  INSURANCE: '보험',
  ACCESSORY: '용품',
}

export const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', icon: 'LayoutDashboard' as const },
  { href: '/bookings', label: '예약 관리', icon: 'Calendar' as const },
  { href: '/menus', label: '메뉴/요금', icon: 'List' as const },
  { href: '/customers', label: '고객 관리', icon: 'Users' as const },
  { href: '/settlements', label: '정산 내역', icon: 'Wallet' as const },
  { href: '/coupons', label: '쿠폰', icon: 'Ticket' as const },
  { href: '/brand', label: '브랜드', icon: 'Palette' as const },
  { href: '/settings/hours', label: '영업 설정', icon: 'Settings' as const },
]

export const SETTINGS_NAV = [
  { href: '/settings/hours', label: '영업시간' },
  { href: '/settings/holidays', label: '휴무일' },
  { href: '/settings/booking', label: '예약 설정' },
  { href: '/settings/staff', label: '직원/베이' },
]
