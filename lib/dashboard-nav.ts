import { NAV_ITEMS } from '@/constants'

const TITLES: Record<string, string> = Object.fromEntries(NAV_ITEMS.map((n) => [n.href, n.label]))

export function getDashboardTitle(pathname: string): string {
  const path = pathname.replace(/^\/demo(\/|$)/, '/dashboard$1')

  if (path.startsWith('/dashboard/reservations')) return '예약 관리'
  if (path.startsWith('/dashboard/menus')) return '메뉴/요금'
  if (path.startsWith('/dashboard/customers')) return '고객 관리'
  if (path.startsWith('/dashboard/vehicles')) return '차량 관리'
  if (path.startsWith('/dashboard/revenue')) return '매출관리'
  if (path.startsWith('/dashboard/billing')) return '요금제 / 결제'
  if (path.startsWith('/dashboard/ai')) return 'AI 운영'
  if (path.startsWith('/dashboard/ads')) return '앱 노출 관리'
  if (path.startsWith('/dashboard/marketing')) return '쿠폰 관리'
  if (path.startsWith('/dashboard/store-app')) return '매장앱 관리'
  if (path.startsWith('/dashboard/operations')) return '운영관리'
  if (path.startsWith('/dashboard/admin')) return '업체 승인'
  if (path.startsWith('/dashboard/settings')) return '설정'
  if (path.startsWith('/bookings/')) return '예약 상세'
  if (path.startsWith('/customers/')) return '고객 상세'
  if (path.startsWith('/menus/')) return '메뉴 상세'
  if (path.startsWith('/settings/')) return '영업 설정'
  if (path.startsWith('/onboarding')) return '업체 등록'
  return TITLES[path] ?? 'AUTOON Business'
}
