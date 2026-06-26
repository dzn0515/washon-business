'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AdminSidebar, { AdminMobileMenuButton } from '@/components/layout/AdminSidebar'
import { isMockAdmin } from '@/lib/admin-auth'

const TITLES: Record<string, string> = {
  '/admin': '대시보드',
  '/admin/businesses': '업체 관리',
  '/admin/businesses/pending': '승인 대기',
  '/admin/revenue': '매출 관리',
  '/admin/notifications': '알림 관리',
  '/admin/settings': '시스템 설정',
}

function getTitle(pathname: string): string {
  if (pathname.startsWith('/admin/businesses/pending')) return TITLES['/admin/businesses/pending']
  if (pathname.startsWith('/admin/businesses')) return TITLES['/admin/businesses']
  return TITLES[pathname] ?? 'WashOn Admin'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!isMockAdmin()) {
      router.replace('/dashboard')
      return
    }
    setAuthorized(true)
  }, [router])

  if (!authorized) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 text-sm text-gray-400">
        권한 확인 중...
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">
          <AdminMobileMenuButton onClick={() => setSidebarOpen(true)} />
          <h1 className="text-base font-semibold text-gray-900">{getTitle(pathname)}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
