'use client'

import ApiAuthProvider from '@/components/providers/ApiAuthProvider'
import DashboardShell from '@/components/layout/DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApiAuthProvider>
      <div className="flex h-[100dvh] bg-gray-50 overflow-hidden flex-col">
        <DashboardShell>{children}</DashboardShell>
      </div>
    </ApiAuthProvider>
  )
}
