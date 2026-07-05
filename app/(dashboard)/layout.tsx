'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import ApiAuthProvider from '@/components/providers/ApiAuthProvider'
import BookingReminderHost from '@/components/features/bookings/BookingReminderHost'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/constants'

const TITLES: Record<string, string> = Object.fromEntries(NAV_ITEMS.map((n) => [n.href, n.label]))

function getTitle(pathname: string) {
  if (pathname.startsWith('/dashboard/reservations')) return '예약 관리'
  if (pathname.startsWith('/dashboard/menus')) return '메뉴/요금'
  if (pathname.startsWith('/dashboard/customers')) return '고객 관리'
  if (pathname.startsWith('/dashboard/vehicles')) return '차량 관리'
  if (pathname.startsWith('/dashboard/revenue')) return '매출관리'
  if (pathname.startsWith('/dashboard/ads')) return '앱 노출'
  if (pathname.startsWith('/dashboard/marketing')) return '쿠폰 관리'
  if (pathname.startsWith('/dashboard/store-app')) return '매장앱 관리'
  if (pathname.startsWith('/dashboard/operations')) return '운영관리'
  if (pathname.startsWith('/dashboard/admin')) return '업체 승인'
  if (pathname.startsWith('/dashboard/settings')) return '설정'
  if (pathname.startsWith('/bookings/')) return '예약 상세'
  if (pathname.startsWith('/customers/')) return '고객 상세'
  if (pathname.startsWith('/menus/')) return '메뉴 상세'
  if (pathname.startsWith('/settings/')) return '영업 설정'
  if (pathname.startsWith('/onboarding')) return '업체 등록'
  return TITLES[pathname] ?? 'AUTOON Business'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <ApiAuthProvider>
      <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 lg:static transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getTitle(pathname)} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-4 max-w-5xl w-full mx-auto">
          {children}
        </main>
        <MobileNav />
      </div>
      <BookingReminderHost />
      </div>
    </ApiAuthProvider>
  )
}
