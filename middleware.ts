import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE = 'washon_access_token'

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
  '/admin/login',
  '/sales/login',
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
]

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
  return '/login'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (token) {
    return NextResponse.next()
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = loginPathFor(pathname)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
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
  ],
}
