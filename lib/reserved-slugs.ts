/** URL segments reserved for AUTOON Business — must not be used as store slugs. */
export const RESERVED_STORE_SLUGS = new Set([
  'demo',
  'dashboard',
  'login',
  'register',
  'admin',
  'join',
  'about',
  'install',
  'bookings',
  'customers',
  'menus',
  'settings',
  'onboarding',
  'pending',
  'brand',
  'coupons',
  'settlements',
  'delete-account',
  'privacy',
  'terms',
  'refund',
  'api',
  'oauth',
  'store',
])

export function isReservedStoreSlug(slug: string): boolean {
  return RESERVED_STORE_SLUGS.has(slug.toLowerCase())
}
