'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import BookingReminderHost from '@/components/features/bookings/BookingReminderHost'
import { cn } from '@/lib/utils'
import { getDashboardTitle } from '@/lib/dashboard-nav'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { isDemo } = useDemoMode()

  return (
    <div className="flex flex-1 min-h-0 bg-gray-50 overflow-hidden">
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      ) : null}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:static transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getDashboardTitle(pathname)} onMenuClick={() => setSidebarOpen(true)} />
        <main
          className={cn(
            'flex-1 overflow-y-auto p-4 max-w-5xl w-full mx-auto',
            isDemo ? 'pb-28 lg:pb-24' : 'pb-20 lg:pb-4',
          )}
        >
          {children}
        </main>
        <MobileNav />
      </div>
      {!isDemo ? <BookingReminderHost /> : null}
    </div>
  )
}
