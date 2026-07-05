'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  UserCog,
  Wallet,
  Sparkles,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_NAV_ITEMS, type DemoNavIconMap } from '@/constants/demo-nav'
import { demoBusiness } from '@/lib/demo-data'

const ICONS: DemoNavIconMap = {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  UserCog,
  Wallet,
  Sparkles,
  Settings,
}

interface DemoSidebarProps {
  onNavigate?: () => void
}

export default function DemoSidebar({ onNavigate }: DemoSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="px-4 py-4 border-b border-gray-100">
        <span className="text-[15px] font-bold text-washon">💧 AUTOON Business Demo</span>
        <p className="text-[11px] text-gray-500 mt-1">사장님 PC 프로그램 미리보기</p>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-900">{demoBusiness.name}</div>
        <div className="text-[11px] text-primary-600 mt-0.5">business.autoon.kr/demo</div>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {DEMO_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon]
          const active =
            item.href === '/demo'
              ? pathname === '/demo'
              : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors',
                active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50',
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
