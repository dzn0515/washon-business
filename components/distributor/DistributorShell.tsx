'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import DistributorSidebar from '@/components/distributor/DistributorSidebar'

export default function DistributorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (pathname === '/distributor/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <DistributorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200 bg-white/95 px-4 backdrop-blur lg:left-64">
        <button
          type="button"
          className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm text-stone-600 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="메뉴 열기"
        >
          메뉴
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">AUTOON Distributor</p>
        </div>
      </header>
      <main className="ml-0 mt-14 min-h-screen p-4 sm:p-6 lg:ml-64">{children}</main>
    </div>
  )
}
