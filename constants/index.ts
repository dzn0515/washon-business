import type { BookingStatus, CustomerGrade, PaymentMethod, PaymentStatus, ServiceTypeCode } from '@/types'
import { BOOKING_STATUS_MAP } from '@/types'

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = Object.fromEntries(
  Object.entries(BOOKING_STATUS_MAP).map(([k, v]) => [k, v.label]),
) as Record<BookingStatus, string>

export const BOOKING_STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  waiting: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  arrived: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-green-100 text-green-800',
  reviewed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
  noshow: 'bg-red-900 text-white',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: '미결제',
  PAID: '결제완료',
  REFUNDED: '환불',
  CANCELLED: '결제취소',
}

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  UNPAID: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  ONSITE: '현장결제',
  APP: '앱결제',
  NONE: '-',
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

export const CUSTOMER_COUPON_STATUS_LABEL: Record<string, string> = {
  issued: '사용 가능',
  used: '사용됨',
  expired: '만료',
  cancelled: '취소',
}

export const CUSTOMER_COUPON_STATUS_STYLE: Record<string, string> = {
  issued: 'bg-green-100 text-green-700',
  used: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
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
  { href: '/dashboard/reservations', label: '예약 관리', icon: 'Calendar' as const },
  { href: '/dashboard/menus', label: '메뉴/요금', icon: 'List' as const },
  { href: '/dashboard/customers', label: '고객 관리', icon: 'Users' as const },
  { href: '/dashboard/reviews', label: '리뷰관리', icon: 'Star' as const },
  { href: '/dashboard/vehicles', label: '차량 관리', icon: 'Car' as const },
  { href: '/dashboard/revenue', label: '매출관리', icon: 'Wallet' as const },
  { href: '/dashboard/payments', label: '결제·정산', icon: 'Wallet' as const },
  { href: '/dashboard/billing', label: '요금제 / 결제', icon: 'CreditCard' as const },
  { href: '/dashboard/ai', label: 'AI 운영 인사이트', icon: 'Sparkles' as const },
  { href: '/dashboard/ads', label: '앱 노출 관리', icon: 'Megaphone' as const },
  { href: '/dashboard/qr', label: '매장 QR', icon: 'QrCode' as const },
  { href: '/dashboard/marketing/coupons', label: '쿠폰 관리', icon: 'Ticket' as const },
  { href: '/dashboard/marketing/review-reward', label: '리뷰 마케팅', icon: 'MessageSquareHeart' as const },
  { href: '/dashboard/store-app', label: '고객앱 매장화면', icon: 'Smartphone' as const },
  { href: '/dashboard/operations/bays', label: '운영관리', icon: 'Wrench' as const },
  { href: '/dashboard/admin', label: '업체 승인', icon: 'ShieldCheck' as const },
  { href: '/dashboard/compliance', label: '사업자·정산 서류', icon: 'ShieldCheck' as const },
  { href: '/dashboard/settings', label: '설정', icon: 'Settings' as const },
]

export const SETTINGS_NAV = [
  { href: '/dashboard/settings', label: '설정' },
  { href: '/dashboard/menus', label: '영업시간/휴무' },
]
