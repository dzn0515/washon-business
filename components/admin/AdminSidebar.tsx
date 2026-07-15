'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdmin } from '@/context/AdminContext'
import { usePermissionMap } from '@/hooks/useAdminPermissions'
import { buildAdminMenusFromRegistry } from '@/lib/admin-menu-registry'

export type AdminMenuItem = {
  icon: string
  label: string
  href: string
  ready: boolean
  permission: string
}

export const ADMIN_MENUS: { group: string; items: AdminMenuItem[] }[] = buildAdminMenusFromRegistry()

const ALL_ITEMS = ADMIN_MENUS.flatMap((s) => s.items)

export default function AdminSidebar() {
  const pathname = usePathname()
  const { toggleFavorite, isFavorite, sidebarSearch, setSidebarSearch } = useAdmin()
  const { canView, loaded } = usePermissionMap()

  const visibleMenus = ADMIN_MENUS.map((section) => ({
    ...section,
    items: section.items.filter((i) => !loaded || canView(i.permission)),
  })).filter((section) => section.items.length > 0)

  const filteredMenus = sidebarSearch
    ? [
        {
          group: '검색 결과',
          items: ALL_ITEMS.filter(
            (i) => i.label.includes(sidebarSearch) && (!loaded || canView(i.permission)),
          ),
        },
      ]
    : visibleMenus

  const favoriteItems = ALL_ITEMS.filter(
    (i) => isFavorite(i.href) && (!loaded || canView(i.permission)),
  )

  const renderItem = (item: AdminMenuItem) => {
    const isActive =
      pathname === item.href ||
      (item.href !== '/admin/dashboard' &&
        pathname.startsWith(`${item.href}/`) &&
        !ALL_ITEMS.some(
          (other) =>
            other.href !== item.href &&
            other.href.length > item.href.length &&
            (pathname === other.href || pathname.startsWith(`${other.href}/`)),
        ))

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
