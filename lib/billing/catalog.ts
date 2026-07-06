export type SubscriptionPlanId = 'basic' | 'standard' | 'premium'

export type SubscriptionStatus =
  | 'free_trial'
  | 'active'
  | 'payment_pending'
  | 'expiring'
  | 'expired'
  | 'pending'
  | 'payment_failed'

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  free_trial: '무료 체험',
  active: '이용중',
  payment_pending: '결제 대기',
  expiring: '만료 예정',
  expired: '만료',
  pending: '신청 대기',
  payment_failed: '결제 실패',
}

export const SUBSCRIPTION_STATUS_STYLE: Record<SubscriptionStatus, string> = {
  free_trial: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  payment_pending: 'bg-amber-100 text-amber-800',
  expiring: 'bg-orange-100 text-orange-800',
  expired: 'bg-gray-100 text-gray-500',
  pending: 'bg-purple-100 text-purple-700',
  payment_failed: 'bg-red-100 text-red-700',
}

export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic' as const,
    name: 'Basic',
    price: 28000,
    platformFee: '8.9%',
    freeTrialNote: '첫 3개월 무료',
  },
  {
    id: 'standard' as const,
    name: 'Standard',
    price: 59000,
    platformFee: '6.9%',
    freeTrialNote: null,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: 99000,
    platformFee: '4.9%',
    freeTrialNote: null,
  },
]

export type AdBillingType = 'monthly' | 'one_time'

export type AdProduct = {
  id: string
  category: 'exposure' | 'ad' | 'automation'
  name: string
  description: string
  price: number
  billingType: AdBillingType
}

export const EXPOSURE_PRODUCTS: AdProduct[] = [
  {
    id: 'exposure-10km',
    category: 'exposure',
    name: '반경 10km',
    description: '노출 반경 10km 확장',
    price: 15000,
    billingType: 'monthly',
  },
  {
    id: 'exposure-20km',
    category: 'exposure',
    name: '반경 20km',
    description: '노출 반경 20km 확장',
    price: 30000,
    billingType: 'monthly',
  },
  {
    id: 'exposure-nation',
    category: 'exposure',
    name: '전국 노출',
    description: '전국 범위 노출',
    price: 50000,
    billingType: 'monthly',
  },
]

export const AD_PRODUCTS: AdProduct[] = [
  {
    id: 'ad-search-top',
    category: 'ad',
    name: '검색 상단 고정',
    description: '7일',
    price: 50000,
    billingType: 'one_time',
  },
  {
    id: 'ad-main-banner',
    category: 'ad',
    name: '앱 메인 배너',
    description: '3일',
    price: 80000,
    billingType: 'one_time',
  },
  {
    id: 'ad-push',
    category: 'ad',
    name: '푸시 알림 발송',
    description: '1회',
    price: 30000,
    billingType: 'one_time',
  },
  {
    id: 'ad-review-boost',
    category: 'ad',
    name: '리뷰 부스팅',
    description: '1회',
    price: 20000,
    billingType: 'one_time',
  },
]

export const AUTOMATION_PRODUCTS: AdProduct[] = [
  {
    id: 'auto-revisit',
    category: 'automation',
    name: '재방문 알림',
    description: '자동 발송',
    price: 5000,
    billingType: 'monthly',
  },
  {
    id: 'auto-birthday',
    category: 'automation',
    name: '생일 쿠폰',
    description: '자동 발송',
    price: 5000,
    billingType: 'monthly',
  },
  {
    id: 'auto-review',
    category: 'automation',
    name: '리뷰 요청',
    description: '자동 발송',
    price: 3000,
    billingType: 'monthly',
  },
  {
    id: 'auto-bundle',
    category: 'automation',
    name: '자동화 전체',
    description: '전체 묶음',
    price: 10000,
    billingType: 'monthly',
  },
]

/** 개별 자동화 3종 합계 (할인 배지용) */
export const AUTOMATION_INDIVIDUAL_PRICE_SUM = AUTOMATION_PRODUCTS.filter(
  (p) => p.id !== 'auto-bundle',
).reduce((sum, p) => sum + p.price, 0)

export const AUTOMATION_BUNDLE_DISCOUNT_BADGE = '개별 합계 13,000원 → 23% 할인'

export const ALL_AD_CATALOG = [...EXPOSURE_PRODUCTS, ...AD_PRODUCTS, ...AUTOMATION_PRODUCTS]

export function getAdProduct(id: string): AdProduct | undefined {
  return ALL_AD_CATALOG.find((p) => p.id === id)
}

export function billingTypeLabel(type: AdBillingType): string {
  return type === 'monthly' ? '월구독' : '1회성'
}
