'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdmin } from '@/context/AdminContext'

export type AdminMenuItem = {
  icon: string
  label: string
  href: string
  ready: boolean
  permission: string
}

export const ADMIN_MENUS: { group: string; items: AdminMenuItem[] }[] = [
  {
    group: '홈',
    items: [
      { icon: '🏠', label: '내 업무', href: '/admin/my', ready: true, permission: 'my.read' },
      {
        icon: '📊',
        label: '대시보드',
        href: '/admin/dashboard',
        ready: true,
        permission: 'dashboard.read',
      },
      { icon: '🔔', label: '알림센터', href: '/admin/alerts', ready: false, permission: 'alerts.read' },
    ],
  },
  {
    group: '업체',
    items: [
      {
        icon: '🏪',
        label: '업체관리',
        href: '/admin/businesses',
        ready: true,
        permission: 'business.read',
      },
      {
        icon: '🏢',
        label: '프랜차이즈',
        href: '/admin/franchise',
        ready: false,
        permission: 'franchise.read',
      },
      { icon: '💼', label: '영업조직', href: '/admin/sales', ready: false, permission: 'sales.read' },
      {
        icon: '📋',
        label: '입점심사',
        href: '/admin/screening',
        ready: false,
        permission: 'screening.read',
      },
    ],
  },
  {
    group: '운영',
    items: [
      {
        icon: '👥',
        label: '고객관리',
        href: '/admin/customers',
        ready: false,
        permission: 'customer.read',
      },
      {
        icon: '📅',
        label: '예약관리',
        href: '/admin/reservations',
        ready: true,
        permission: 'reservation.read',
      },
      { icon: '🎧', label: '고객센터', href: '/admin/cs', ready: true, permission: 'cs.read' },
      { icon: '📣', label: '공지/알림', href: '/admin/notices', ready: true, permission: 'notices.read' },
      { icon: '⭐', label: '리뷰', href: '/admin/reviews', ready: false, permission: 'review.read' },
    ],
  },
  {
    group: '수익',
    items: [
      {
        icon: '💰',
        label: '결제/정산',
        href: '/admin/payments',
        ready: false,
        permission: 'payment.read',
      },
      { icon: '🧾', label: '재무', href: '/admin/finance', ready: false, permission: 'finance.read' },
      {
        icon: '📢',
        label: '광고 신청 관리',
        href: '/admin/ad-applications',
        ready: true,
        permission: 'ads.read',
      },
      { icon: '🎁', label: '쿠폰', href: '/admin/coupons', ready: false, permission: 'coupon.read' },
    ],
  },
  {
    group: '분석',
    items: [
      { icon: '📈', label: '통계', href: '/admin/stats', ready: false, permission: 'stats.read' },
      { icon: '🏆', label: 'SLA', href: '/admin/sla', ready: false, permission: 'sla.read' },
    ],
  },
  {
    group: '서비스',
    items: [
      {
        icon: '🚗',
        label: '서비스관리',
        href: '/admin/services',
        ready: false,
        permission: 'service.read',
      },
      { icon: '🔗', label: 'QR관리', href: '/admin/qr', ready: true, permission: 'qr.read' },
      {
        icon: '🖼️',
        label: '콘텐츠',
        href: '/admin/contents',
        ready: false,
        permission: 'content.read',
      },
      {
        icon: '📁',
        label: '문서관리',
        href: '/admin/documents',
        ready: false,
        permission: 'document.read',
      },
    ],
  },
  {
    group: '자동화',
    items: [
      {
        icon: '⚙️',
        label: '자동화',
        href: '/admin/automation',
        ready: false,
        permission: 'automation.read',
      },
      { icon: '🔌', label: 'API', href: '/admin/api', ready: false, permission: 'api.read' },
      { icon: '📱', label: '앱관리', href: '/admin/app', ready: false, permission: 'app.read' },
    ],
  },
  {
    group: '데이터',
    items: [
      { icon: '📂', label: '데이터관리', href: '/admin/data', ready: false, permission: 'data.read' },
      {
        icon: '📦',
        label: '파일저장소',
        href: '/admin/storage',
        ready: false,
        permission: 'storage.read',
      },
    ],
  },
  {
    group: '시스템',
    items: [
      {
        icon: '⚙️',
        label: '운영설정',
        href: '/admin/settings',
        ready: true,
        permission: 'settings.read',
      },
      { icon: '🔐', label: '보안', href: '/admin/security', ready: true, permission: 'security.read' },
      { icon: '👑', label: '권한관리', href: '/admin/roles', ready: true, permission: 'roles.read' },
      { icon: '🗂️', label: '운영감사', href: '/admin/audit', ready: false, permission: 'audit.read' },
      { icon: '🖥️', label: '시스템', href: '/admin/system', ready: true, permission: 'system.read' },
      { icon: '🤖', label: 'AI', href: '/admin/ai', ready: false, permission: 'ai.read' },
    ],
  },
]

const ALL_ITEMS = ADMIN_MENUS.flatMap((s) => s.items)

export default function AdminSidebar() {
  const pathname = usePathname()
  const { toggleFavorite, isFavorite, sidebarSearch, setSidebarSearch } = useAdmin()

  const filteredMenus = sidebarSearch
    ? [{ group: '검색 결과', items: ALL_ITEMS.filter((i) => i.label.includes(sidebarSearch)) }]
    : ADMIN_MENUS

  const favoriteItems = ALL_ITEMS.filter((i) => isFavorite(i.href))

  const renderItem = (item: AdminMenuItem) => {
    const isActive =
      pathname === item.href ||
      (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

    return (
      <li key={item.href} className="group relative">
        <Link
          href={item.ready ? item.href : '#'}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive
              ? 'bg-blue-600 text-white'
              : item.ready
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span className="text-base">{item.icon}</span>
            {item.label}
          </span>
          <span className="flex items-center gap-1">
            {!item.ready && (
              <span className="text-[9px] bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">
                준비중
              </span>
            )}
            {item.ready && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  toggleFavorite(item.href)
                }}
                className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                title="즐겨찾기"
              >
                {isFavorite(item.href) ? '⭐' : '☆'}
              </button>
            )}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0F172A] overflow-y-auto z-40 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700/50 flex-shrink-0">
        <span className="text-white font-bold text-lg tracking-tight">
          AUTOON
          <span className="text-blue-400 text-xs font-normal ml-2">Admin</span>
        </span>
      </div>

      <div className="px-3 py-3 border-b border-slate-700/50 flex-shrink-0">
        <input
          type="text"
          value={sidebarSearch}
          onChange={(e) => setSidebarSearch(e.target.value)}
          placeholder="메뉴 검색..."
          className="w-full bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg outline-none placeholder-slate-600 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {!sidebarSearch && favoriteItems.length > 0 && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 px-3 mb-2">
              ⭐ 즐겨찾기
            </p>
            <ul className="space-y-0.5">{favoriteItems.map(renderItem)}</ul>
          </div>
        )}

        {filteredMenus.map((section) => (
          <div key={section.group}>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 px-3 mb-2">
              {section.group}
            </p>
            <ul className="space-y-0.5">{section.items.map(renderItem)}</ul>
          </div>
        ))}

        {sidebarSearch && filteredMenus[0]?.items.length === 0 && (
          <p className="text-xs text-slate-600 px-3 py-4 text-center">검색 결과가 없습니다.</p>
        )}
      </nav>

      <div className="px-6 py-4 border-t border-slate-700/50 flex-shrink-0">
        <p className="text-[10px] text-slate-600">AUTOON Admin v1.0</p>
        <p className="text-[10px] text-slate-600">Sellem Inc.</p>
      </div>
    </aside>
  )
}
