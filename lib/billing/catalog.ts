export type SubscriptionPlanId = 'basic' | 'standard' | 'premium'



export type SubscriptionStatus =

  | 'free_trial'

  | 'active'

  | 'payment_pending'

  | 'expiring'

  | 'expired'

  | 'pending'

  | 'payment_failed'

  | 'cancelled'

  | 'terminated'



export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {

  free_trial: '무료 체험',

  active: '이용중',

  payment_pending: '결제 대기',

  expiring: '만료 예정',

  expired: '만료',

  pending: '신청 대기',

  payment_failed: '결제 실패',

  cancelled: '해지',

  terminated: '강제 종료',

}



export const SUBSCRIPTION_STATUS_STYLE: Record<SubscriptionStatus, string> = {

  free_trial: 'bg-blue-100 text-blue-700',

  active: 'bg-green-100 text-green-700',

  payment_pending: 'bg-amber-100 text-amber-800',

  expiring: 'bg-orange-100 text-orange-800',

  expired: 'bg-gray-100 text-gray-500',

  pending: 'bg-purple-100 text-purple-700',

  payment_failed: 'bg-red-100 text-red-700',

  cancelled: 'bg-gray-100 text-gray-600',

  terminated: 'bg-red-100 text-red-800',

}



export type SubscriptionPlan = {

  id: SubscriptionPlanId

  name: string

  price: number

  platformFee: string

  freeTrialNote: string | null

  features: string[]

  /** Included ad exposure without separate ad purchase. */

  includedExposureRadiusMeters: number

  includesAutomation: boolean

}



/**

 * Subscription plans — mirrors autoon-api subscription_plan_catalog.

 * Prices VAT 별도.

 */

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [

  {

    id: 'basic',

    name: 'Basic',

    price: 28000,

    platformFee: '8.9%',

    freeTrialNote: '첫 3개월 무료',

    features: [
      '예약 관리',
      '고객 관리',
      '차량 이력',
      '매출·정산 기본 기능',
      '기본 500m 노출',
      '자동화 기능 미포함',
    ],

    includedExposureRadiusMeters: 500,

    includesAutomation: false,

  },

  {

    id: 'standard',

    name: 'Standard',

    price: 59000,

    platformFee: '6.9%',

    freeTrialNote: null,

    features: [

      'Basic 전체 포함',

      '생일 쿠폰 자동화',

      '리뷰 요청 자동화',

      '재방문 알림 자동화',

      '기본 500m 노출',

    ],

    includedExposureRadiusMeters: 500,

    includesAutomation: true,

  },

  {

    id: 'premium',

    name: 'Premium',

    price: 99000,

    platformFee: '4.9%',

    freeTrialNote: null,

    features: [

      'Standard 전체 포함',

      '1.5km 거리 노출 포함',

      '월 30,000원 상당의 1.5km 거리 노출이 포함됩니다',

      '별도 신청 없이 자동 적용',

    ],

    includedExposureRadiusMeters: 1500,

    includesAutomation: true,

  },

]



export function getSubscriptionPlan(id: string | null | undefined): SubscriptionPlan | undefined {

  const key = (id || 'basic').toLowerCase()

  return SUBSCRIPTION_PLANS.find((p) => p.id === key)

}



export type AdBillingType = 'monthly' | 'one_time'



export type AdProduct = {

  id: string

  category: 'exposure' | 'ad' | 'automation'

  name: string

  description: string

  price: number

  billingType: AdBillingType

}



/** Free tier for subscribed partners — no purchase SKU. */

export const DEFAULT_EXPOSURE_RADIUS_METERS = 500



/** Exposure SKUs — prices are VAT excluded (VAT 별도). Mirrors autoon-api ad_product_catalog. */

export const REGIONAL_EXPOSURE_PRODUCTS: AdProduct[] = [

  {

    id: 'exposure-1km',

    category: 'exposure',

    name: '반경 1km 노출',

    description: '지역 노출 반경 1km · VAT 별도',

    price: 15000,

    billingType: 'monthly',

  },

  {

    id: 'exposure-1_5km',

    category: 'exposure',

    name: '반경 1.5km 노출',

    description: '지역 노출 반경 1.5km · VAT 별도',

    price: 30000,

    billingType: 'monthly',

  },

  {

    id: 'exposure-3km',

    category: 'exposure',

    name: '반경 3km 노출',

    description: '지역 노출 반경 3km · VAT 별도',

    price: 50000,

    billingType: 'monthly',

  },

]



export const PREMIUM_EXPOSURE_PRODUCT: AdProduct = {

  id: 'exposure-10km-premium',

  category: 'exposure',

  name: '10km 프리미엄 노출',

  description: '반경 10km · 홈 추천·우선 노출·Premium 배지 · 관리자 승인 필수 · VAT 별도',

  price: 100000,

  billingType: 'monthly',

}

/** @deprecated use PREMIUM_EXPOSURE_PRODUCT */
export const NATIONWIDE_EXPOSURE_PRODUCT = PREMIUM_EXPOSURE_PRODUCT



export const EXPOSURE_PRODUCTS: AdProduct[] = [

  ...REGIONAL_EXPOSURE_PRODUCTS,

  PREMIUM_EXPOSURE_PRODUCT,

]



/** Retired SKUs — display/history only; not sold. */

export const LEGACY_EXPOSURE_PRODUCTS: AdProduct[] = [

  {

    id: 'exposure-10km',

    category: 'exposure',

    name: '반경 10km (구상품)',

    description: '운영 종료 · 신규 신청 불가',

    price: 20000,

    billingType: 'monthly',

  },

  {

    id: 'exposure-15km',

    category: 'exposure',

    name: '반경 15km (구상품)',

    description: '운영 종료 · 신규 신청 불가',

    price: 30000,

    billingType: 'monthly',

  },

  {

    id: 'exposure-20km',

    category: 'exposure',

    name: '반경 20km (구상품)',

    description: '운영 종료 · 신규 신청 불가',

    price: 30000,

    billingType: 'monthly',

  },

  {

    id: 'exposure-30km',

    category: 'exposure',

    name: '반경 30km (구상품)',

    description: '운영 종료 · 신규 신청 불가',

    price: 50000,

    billingType: 'monthly',

  },

  {

    id: 'exposure-nation',

    category: 'exposure',

    name: '전국 프리미엄 (구상품)',

    description: '운영 종료 · 신규 신청 불가',

    price: 100000,

    billingType: 'monthly',

  },

]



export const LEGACY_EXPOSURE_PRODUCT_IDS = LEGACY_EXPOSURE_PRODUCTS.map((p) => p.id)



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

    description: 'Standard 이상 플랜 포함 · 신규 판매 종료',

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

  return (

    ALL_AD_CATALOG.find((p) => p.id === id) ??

    LEGACY_EXPOSURE_PRODUCTS.find((p) => p.id === id)

  )

}



export function billingTypeLabel(type: AdBillingType): string {

  return type === 'monthly' ? '월구독' : '1회성'

}



export function formatDefaultExposureLabel(radiusMeters = DEFAULT_EXPOSURE_RADIUS_METERS): string {

  if (radiusMeters >= 1000 && radiusMeters % 1000 === 0) {

    return `기본 반경 ${radiusMeters / 1000}km`

  }

  return `기본 반경 ${radiusMeters}m`

}


