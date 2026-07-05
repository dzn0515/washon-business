'use client'

import { DemoModeProvider } from '@/components/providers/DemoModeProvider'
import DemoBanner from '@/components/demo/DemoBanner'
import DemoFloatingCta from '@/components/demo/DemoFloatingCta'
import DashboardShell from '@/components/layout/DashboardShell'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoModeProvider>
      <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
        <DemoBanner />
        <DashboardShell>{children}</DashboardShell>
        <DemoFloatingCta />
      </div>
    </DemoModeProvider>
  )
}
