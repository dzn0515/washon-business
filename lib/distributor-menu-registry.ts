/**
 * Stable Distributor Portal menu keys — keep in sync with autoon-api
 * distributor_menu_registry (app/services/distributor_menu_registry.py).
 *
 * Completely separate from the Admin RBAC menu registry
 * (lib/admin-menu-registry.ts) — do not merge these.
 */

export type DistributorMenuDef = {
  key: string
  label: string
  href: string
  group: string
  icon: string
  ready: boolean
}

export const DISTRIBUTOR_MENU_REGISTRY: DistributorMenuDef[] = [
  { key: 'dashboard', label: '대시보드', href: '/distributor', group: '홈', icon: '📊', ready: true },
  { key: 'agencies', label: '영업점', href: '/distributor/agencies', group: '조직', icon: '🏪', ready: true },
  { key: 'agents', label: '영업사원', href: '/distributor/agents', group: '조직', icon: '👤', ready: true },
  { key: 'partners', label: '업체', href: '/distributor/partners', group: '영업', icon: '🏢', ready: true },
  { key: 'leads', label: '입점 신청', href: '/distributor/leads', group: '영업', icon: '📝', ready: true },
  { key: 'performance', label: '실적', href: '/distributor/performance', group: '실적', icon: '📈', ready: true },
  { key: 'commission', label: '수수료', href: '/distributor/commission', group: '정산', icon: '💹', ready: true },
  { key: 'settlements', label: '정산 내역', href: '/distributor/settlements', group: '정산', icon: '📑', ready: true },
  { key: 'staff', label: '직원관리', href: '/distributor/staff', group: '시스템', icon: '🧑\u200d💼', ready: true },
  { key: 'roles', label: '권한관리', href: '/distributor/roles', group: '시스템', icon: '🔐', ready: true },
  { key: 'me', label: '내 정보', href: '/distributor/me', group: '시스템', icon: '👤', ready: true },
]

export function menuKeyForPath(pathname: string): string | null {
  const sorted = [...DISTRIBUTOR_MENU_REGISTRY].sort((a, b) => b.href.length - a.href.length)
  for (const m of sorted) {
    if (pathname === m.href || pathname.startsWith(`${m.href}/`)) return m.key
  }
  return null
}
