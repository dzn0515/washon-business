'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  Headphones,
  List,
  Smartphone,
  Users,
  Wallet,
} from 'lucide-react'

export type QuickAction = {
  href: string
  label: string
  icon: LucideIcon
}

const DEFAULT_ACTIONS: QuickAction[] = [
  { href: '/dashboard/reservations', label: '예약 관리', icon: Calendar },
  { href: '/dashboard/customers', label: '고객 관리', icon: Users },
  { href: '/dashboard/menus', label: '메뉴/요금', icon: List },
  { href: '/dashboard/revenue', label: '매출관리', icon: Wallet },
  { href: '/dashboard/store-app', label: '고객앱 매장화면', icon: Smartphone },
  { href: '/dashboard/support', label: '고객센터', icon: Headphones },
]

export default function DashboardQuickActions({
  href,
  actions = DEFAULT_ACTIONS,
}: {
  href: (path: string) => string
  actions?: QuickAction[]
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={href(a.href)}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3.5 text-center shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon size={18} aria-hidden />
            </span>
            <span className="text-xs font-medium text-gray-800 leading-tight">{a.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
