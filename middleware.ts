import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE = 'washon_access_token'
const PORTAL_COOKIE = 'washon_crm_portal'

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/pending',
  '/join',
  '/about',
  '/delete-account',
  '/install',
  '/demo',
  '/store',
  '/change-password',
  '/admin/login',
  '/admin/change-password',
  '/sales/login',
  '/distributor/login',
  '/agency/login',
]

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/bookings',
  '/menus',
  '/settings',
  '/customers',
  '/coupons',
  '/settlements',
  '/brand',
  '/admin',
  '/sales',
  '/distributor',
  '/agency',
]

const PORTAL_HOME: Record<string, string> = {
  OWNER: '/dashboard',
  ADMIN: '/admin',
  DISTRIBUTOR: '/distributor',
  SALES: '/sales',
  AGENCY: '/agency',
}

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function loginPathFor(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin/login'
  if (pathname.startsWith('/sales')) return '/sales/login'
  if (pathname.startsWith('/distributor')) return '/distributor/login'
  if (pathname.startsWith('/agency')) return '/agency/login'
  return '/login'
}

function portalForPath(pathname: string): string | null {
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (!token) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = loginPathFor(pathname)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const portal = request.cookies.get(PORTAL_COOKIE)?.value
  const required = portalForPath(pathname)
  if (portal && required && portal !== required) {
    const home = PORTAL_HOME[portal] || '/login'
    const url = request.nextUrl.clone()
    url.pathname = home
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/menus/:path*',
    '/settings/:path*',
    '/customers/:path*',
    '/coupons/:path*',
    '/settlements/:path*',
    '/brand/:path*',
    '/admin/:path*',
    '/sales',
    '/sales/:path*',
    '/distributor',
    '/distributor/:path*',
    '/agency',
    '/agency/:path*',
  ],
}
