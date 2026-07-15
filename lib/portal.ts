/** Unified CRM portal routing — FE must use `portal` from login, not role string sprawl. */

export type CrmPortal = 'OWNER' | 'ADMIN' | 'DISTRIBUTOR' | 'SALES' | 'AGENCY'

export const PORTAL_HOME: Record<CrmPortal, string> = {
  OWNER: '/dashboard',
  ADMIN: '/admin',
  DISTRIBUTOR: '/distributor',
  SALES: '/sales',
  AGENCY: '/agency',
}

export const PORTAL_LOGIN: Record<CrmPortal, string> = {
  OWNER: '/login',
  ADMIN: '/admin/login',
  DISTRIBUTOR: '/distributor/login',
  SALES: '/sales/login',
  AGENCY: '/agency/login',
}

export const PORTAL_STORAGE_KEY = 'washon_crm_portal'
export const PORTAL_COOKIE = 'washon_crm_portal'

const PORTAL_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7

export function isCrmPortal(value: unknown): value is CrmPortal {
  return (
    value === 'OWNER' ||
    value === 'ADMIN' ||
    value === 'DISTRIBUTOR' ||
    value === 'SALES' ||
    value === 'AGENCY'
  )
}

/** Alias used by callers that need a null-safe normalize. */
export function normalizePortal(value: unknown): CrmPortal | null {
  return isCrmPortal(value) ? value : null
}

export function homeForPortal(portal: CrmPortal): string {
  return PORTAL_HOME[portal]
}

export function getPortalHome(portal: CrmPortal): string {
  return homeForPortal(portal)
}

export function getPortalLogin(portal: CrmPortal): string {
  return PORTAL_LOGIN[portal]
}

export function setStoredPortal(portal: CrmPortal | null): void {
  if (typeof window === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  if (!portal) {
    sessionStorage.removeItem(PORTAL_STORAGE_KEY)
    document.cookie = `${PORTAL_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
    return
  }
  sessionStorage.setItem(PORTAL_STORAGE_KEY, portal)
  document.cookie = `${PORTAL_COOKIE}=${encodeURIComponent(portal)}; Path=/; Max-Age=${PORTAL_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`
}

export function getStoredPortal(): CrmPortal | null {
  if (typeof window === 'undefined') return null
  const v = sessionStorage.getItem(PORTAL_STORAGE_KEY)
  return isCrmPortal(v) ? v : null
}

/** Which portal a pathname belongs to (for wrong-portal blocking). */
export function portalForPath(pathname: string): CrmPortal | null {
  if (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/menus') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/coupons') ||
    pathname.startsWith('/settlements') ||
    pathname.startsWith('/brand')
  ) {
    return 'OWNER'
  }
  if (pathname.startsWith('/admin')) return 'ADMIN'
  if (pathname.startsWith('/distributor')) return 'DISTRIBUTOR'
  if (pathname.startsWith('/sales')) return 'SALES'
  if (pathname.startsWith('/agency')) return 'AGENCY'
  return null
}

export function pathAllowedForPortal(pathname: string, portal: CrmPortal): boolean {
  if (pathname === '/change-password' || pathname.startsWith('/change-password/')) return true
  if (pathname === '/login' || pathname.startsWith('/login')) return true
  const required = portalForPath(pathname)
  if (!required) return true
  return required === portal
}
