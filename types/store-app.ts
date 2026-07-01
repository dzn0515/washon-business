/** 고객앱 매장 전용 모드(Store Mode)와 호환되는 관리 타입 */

export interface StoreAppInfo {
  id: string
  name: string
  slug: string
  description: string
  phone: string
  address: string
  /** 예: "09:00~20:00" — 고객앱 store.hours */
  hours: string
  /** 고객앱 StoreContext.brandColor / API primary_color */
  brandColor: string
  logoUrl: string
  bannerUrl: string
}

export interface StoreAppService {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
  isVisible: boolean
}

export interface StoreAppCoupon {
  id: string
  name: string
  discountType: 'FIXED' | 'PERCENT'
  discountValue: number
  validFrom: string
  validUntil: string
  description: string
  isVisible: boolean
}

export interface StoreAppEvent {
  id: string
  title: string
  description: string
  period: string
  isVisible: boolean
}

export interface StoreAppProfile {
  store: StoreAppInfo
  services: StoreAppService[]
  coupons: StoreAppCoupon[]
  events: StoreAppEvent[]
}

/** 고객앱(autoon/washon) StoreCoupon 형식으로 변환 */
export interface CustomerStoreCoupon {
  id: string
  storeId: string
  storeSlug: string
  storeName: string
  title: string
  description: string
  discountLabel: string
  expiresAt: string
}

/** 고객앱 StoreEvent 형식으로 변환 */
export interface CustomerStoreEvent {
  id: string
  storeId: string
  storeSlug: string
  storeName: string
  title: string
  description: string
  period: string
  badge?: string
}
