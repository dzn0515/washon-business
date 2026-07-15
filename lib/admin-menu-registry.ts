/** Stable admin menu keys — keep in sync with autoon-api admin_menu_registry. */

export type AdminMenuDef = {
  key: string
  label: string
  href: string
  group: string
  icon: string
  ready: boolean
}

export const ADMIN_MENU_REGISTRY: AdminMenuDef[] = [
  { key: 'my_tasks', label: '내 업무', href: '/admin/my', group: '홈', icon: '🏠', ready: true },
  { key: 'dashboard', label: '대시보드', href: '/admin/dashboard', group: '홈', icon: '📊', ready: true },
  { key: 'notifications', label: '알림센터', href: '/admin/alerts', group: '홈', icon: '🔔', ready: true },
  { key: 'businesses', label: '업체관리', href: '/admin/businesses', group: '업체', icon: '🏪', ready: true },
  { key: 'franchises', label: '프랜차이즈', href: '/admin/franchises', group: '업체', icon: '🏢', ready: true },
  { key: 'sales_dashboard', label: '영업 대시보드', href: '/admin/sales', group: '업체', icon: '💼', ready: true },
  { key: 'sales_distributors', label: '총판 관리', href: '/admin/sales/distributors', group: '업체', icon: '🏬', ready: true },
  { key: 'sales_agencies', label: '영업점 관리', href: '/admin/sales/agencies', group: '업체', icon: '🏪', ready: true },
  { key: 'sales_agents', label: '영업사원 관리', href: '/admin/sales/agents', group: '업체', icon: '👤', ready: true },
  { key: 'sales_leads', label: '입점 신청 관리', href: '/admin/sales/leads', group: '업체', icon: '📝', ready: true },
  { key: 'sales_assignments', label: '업체 배정', href: '/admin/sales/assignments', group: '업체', icon: '🔗', ready: true },
  { key: 'sales_commission_policies', label: '수수료 정책', href: '/admin/sales/commission', group: '업체', icon: '💹', ready: true },
  { key: 'sales_settlements', label: '정산 관리', href: '/admin/sales/settlements', group: '업체', icon: '📑', ready: true },
  { key: 'business_reviews', label: '입점심사', href: '/admin/businesses/pending', group: '업체', icon: '📋', ready: true },
  { key: 'customers', label: '고객관리', href: '/admin/users', group: '운영', icon: '👥', ready: true },
  { key: 'reservations', label: '예약관리', href: '/admin/reservations', group: '운영', icon: '📅', ready: true },
  { key: 'support', label: '고객센터', href: '/admin/cs', group: '운영', icon: '🎧', ready: true },
  { key: 'announcements', label: '공지/알림', href: '/admin/notices', group: '운영', icon: '📢', ready: true },
  { key: 'reviews', label: '리뷰관리', href: '/admin/reviews', group: '운영', icon: '⭐', ready: true },
  { key: 'review_reports', label: '리뷰신고', href: '/admin/review-reports', group: '운영', icon: '🚩', ready: true },
  { key: 'ad_applications', label: '광고 신청 관리', href: '/admin/ad-applications', group: '수익', icon: '📣', ready: true },
  { key: 'subscriptions', label: '구독 관리', href: '/admin/subscriptions', group: '수익', icon: '💳', ready: true },
  { key: 'coupons', label: '쿠폰', href: '/admin/coupons', group: '수익', icon: '🎟️', ready: true },
  { key: 'qr', label: 'QR관리', href: '/admin/qr', group: '서비스', icon: '▣', ready: true },
  { key: 'banners', label: '배너 관리', href: '/admin/banners', group: '서비스', icon: '🖼️', ready: true },
  { key: 'operations_settings', label: '운영설정', href: '/admin/settings', group: '시스템', icon: '⚙️', ready: true },
  { key: 'security', label: '보안', href: '/admin/security', group: '시스템', icon: '🔐', ready: true },
  { key: 'permissions', label: '권한관리', href: '/admin/roles', group: '시스템', icon: '👑', ready: true },
  { key: 'staff', label: '직원 계정', href: '/admin/staff', group: '시스템', icon: '🧑‍💼', ready: true },
  { key: 'system', label: '시스템', href: '/admin/system', group: '시스템', icon: '🖥️', ready: true },
]

export function menuKeyForPath(pathname: string): string | null {
  const sorted = [...ADMIN_MENU_REGISTRY].sort((a, b) => b.href.length - a.href.length)
  for (const m of sorted) {
    if (pathname === m.href || pathname.startsWith(`${m.href}/`)) return m.key
  }
  return null
}

export function buildAdminMenusFromRegistry() {
  const groups = new Map<string, AdminMenuDef[]>()
  for (const m of ADMIN_MENU_REGISTRY) {
    const list = groups.get(m.group) ?? []
    list.push(m)
    groups.set(m.group, list)
  }
  return Array.from(groups.entries()).map(([group, items]) => ({
    group,
    items: items.map((i) => ({
      icon: i.icon,
      label: i.label,
      href: i.href,
      ready: i.ready,
      permission: i.key,
    })),
  }))
}
