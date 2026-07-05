import type {
  CustomerStoreCoupon,
  CustomerStoreEvent,
  StoreAppCoupon,
  StoreAppEvent,
  StoreAppInfo,
  StoreAppProfile,
  StoreAppService,
} from '@/types/store-app'

function couponLabel(c: StoreAppCoupon): string {
  return c.discountType === 'FIXED'
    ? `${c.discountValue.toLocaleString()}원`
    : `${c.discountValue}% OFF`
}

export function toCustomerCoupon(c: StoreAppCoupon, store: StoreAppInfo): CustomerStoreCoupon {
  return {
    id: c.id,
    storeId: store.id,
    storeSlug: store.slug,
    storeName: store.name,
    title: c.name,
    description: c.description,
    discountLabel: couponLabel(c),
    expiresAt: c.validUntil.replace(/-/g, '.'),
  }
}

export function toCustomerEvent(e: StoreAppEvent, store: StoreAppInfo): CustomerStoreEvent {
  return {
    id: e.id,
    storeId: store.id,
    storeSlug: store.slug,
    storeName: store.name,
    title: e.title,
    description: e.description,
    period: e.period,
  }
}

/** 고객앱 store + services 연결용 스냅샷 */
export function toCustomerStoreSnapshot(profile: StoreAppProfile) {
  const visibleServices = profile.services.filter((s) => s.isVisible)
  const visibleCoupons = profile.coupons
    .filter((c) => c.isVisible)
    .map((c) => toCustomerCoupon(c, profile.store))
  const visibleEvents = profile.events
    .filter((e) => e.isVisible)
    .map((e) => toCustomerEvent(e, profile.store))

  return {
    store: {
      id: profile.store.id,
      name: profile.store.name,
      slug: profile.store.slug,
      phone: profile.store.phone,
      address: profile.store.address,
      hours: profile.store.hours,
      brandColor: profile.store.brandColor,
      description: profile.store.description,
      logoUrl: profile.store.logoUrl,
      bannerUrl: profile.store.bannerUrl,
    },
    services: visibleServices.map(toCustomerService),
    coupons: visibleCoupons,
    events: visibleEvents,
  }
}

export function toCustomerService(s: StoreAppService) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    duration: s.durationMinutes,
    basePrice: s.price,
  }
}

export function getStoreAppDeepLink(slug: string): string {
  return `autoon://store/${encodeURIComponent(slug)}`
}

export function getStoreAppWebUrl(slug: string): string {
  return `https://autoon.kr/store/${encodeURIComponent(slug)}`
}

/** washon-app AsyncStorage 가져오기용 JSON (version 1) */
export interface WashOnStoreAppExportV1 {
  version: 1
  exportedAt: string
  store: ReturnType<typeof toCustomerStoreSnapshot>['store']
  services: ReturnType<typeof toCustomerStoreSnapshot>['services']
  coupons: ReturnType<typeof toCustomerStoreSnapshot>['coupons']
  events: ReturnType<typeof toCustomerStoreSnapshot>['events']
}

export function toStoreAppExportJson(profile: StoreAppProfile): WashOnStoreAppExportV1 {
  const snapshot = toCustomerStoreSnapshot(profile)
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...snapshot,
  }
}

export function serializeStoreAppExport(profile: StoreAppProfile): string {
  return JSON.stringify(toStoreAppExportJson(profile), null, 2)
}

export function downloadStoreAppExport(profile: StoreAppProfile): void {
  const json = serializeStoreAppExport(profile)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `washon-store-app-${profile.store.slug}.json`
  a.click()
  URL.revokeObjectURL(url)
}
