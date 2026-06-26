'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, List, Users, Wallet, Settings, Megaphone, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/constants'
import { mockBusiness } from '@/lib/mock/data'
import { isAdminUser } from '@/lib/api-client'

const ICONS = {
  LayoutDashboard, Calendar, List, Users, Wallet, Settings, Megaphone, ShieldCheck,
}

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="px-4 py-4 border-b border-gray-100">
        <span className="text-[15px] font-bold text-washon">💧 WashOn Business</span>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-900">{mockBusiness.name}</div>
        <div className="text-[11px] text-primary-600 mt-0.5">business.washon.kr</div>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.filter((item) => item.href !== '/dashboard/admin' || isAdminUser()).map((item) => {
          const Icon = ICONS[item.icon]
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
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
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
