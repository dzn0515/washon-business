export type SubscriptionPlanId = 'basic' | 'standard' | 'premium'

export type SubscriptionStatus =
  | 'free_trial'
  | 'active'
  | 'expiring'
  | 'pending'
  | 'inactive'

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  free_trial: '무료기간',
  active: '이용중',
  expiring: '만료예정',
  pending: '신청대기',
  inactive: '미이용',
}

export const SUBSCRIPTION_STATUS_STYLE: Record<SubscriptionStatus, string> = {
  free_trial: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  expiring: 'bg-amber-100 text-amber-800',
  pending: 'bg-gray-100 text-gray-700',
  inactive: 'bg-gray-100 text-gray-500',
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
    price: 15000,
    billingType: 'monthly',
  },
]

export const ALL_AD_CATALOG = [...EXPOSURE_PRODUCTS, ...AD_PRODUCTS, ...AUTOMATION_PRODUCTS]

export function getAdProduct(id: string): AdProduct | undefined {
  return ALL_AD_CATALOG.find((p) => p.id === id)
}

export function billingTypeLabel(type: AdBillingType): string {
  return type === 'monthly' ? '월구독' : '1회성'
}
