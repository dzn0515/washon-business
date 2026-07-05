'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Store,
  Clock,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockStats } from '@/lib/mock/admin-data'
import { clearAuthSession } from '@/lib/api-client'

const NAV = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/businesses', label: '업체 관리', icon: Store },
  { href: '/admin/businesses/pending', label: '승인 대기', icon: Clock, badge: mockStats.pendingCount },
  { href: '/admin/revenue', label: '매출 관리', icon: Wallet },
  { href: '/admin/notifications', label: '알림 관리', icon: Bell },
  { href: '/admin/settings', label: '시스템 설정', icon: Settings },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = () => {
    clearAuthSession()
    router.push('/admin/login')
    onNavigate?.()
  }

  return (
    <>
      <div className="px-4 py-4 border-b border-gray-100">
        <span className="text-[15px] font-bold text-[#1A6DFF]">💧 AUTOON Admin</span>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-900">관리자: 슈퍼어드민</div>
        <div className="text-[11px] text-gray-400 mt-0.5">admin@washon.kr</div>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors',
                active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-100 p-2">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-gray-500 hover:bg-gray-50 rounded-lg"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </>
  )
}

export default function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          'w-[220px] bg-white border-r border-gray-100 flex flex-col h-full shrink-0',
          'fixed inset-y-0 left-0 z-50 lg:static transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="lg:hidden flex justify-end p-2 border-b border-gray-100">
          <button type="button" onClick={onClose} className="p-2 text-gray-500">
            <X size={20} />
          </button>
        </div>
        <AdminSidebarContent onNavigate={onClose} />
      </aside>
    </>
  )
}

export function AdminMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="lg:hidden p-2 -ml-2 text-gray-600">
      <Menu size={22} />
    </button>
  )
}
