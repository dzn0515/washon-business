'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, List, Users, Wallet, Settings, Megaphone, ShieldCheck, Smartphone, Wrench, Ticket, Car, QrCode, Sparkles, CreditCard, Star, MessageSquareHeart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/constants'
import { isAdminUser } from '@/lib/api-client'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'

const ICONS = {
  LayoutDashboard, Calendar, List, Users, Wallet, Settings, Megaphone, ShieldCheck, Smartphone, Wrench, Ticket, Car, QrCode, Sparkles, CreditCard, Star, MessageSquareHeart,
}

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { isDemo, href } = useDemoMode()
  const { display, loading, error, isDemo: businessDemo } = useBusinessMe()

  const businessName = businessDemo
    ? display?.name
    : loading
      ? '불러오는 중…'
      : error
        ? '사업자 정보 없음'
        : (display?.name ?? '사업자 정보 없음')

  const businessHost = isDemo
    ? 'business.autoon.kr/demo'
    : display?.slug
      ? `business.autoon.kr · ${display.slug}`
      : 'business.autoon.kr'

  return (
    <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="px-4 py-4 border-b border-gray-100">
        <span className="text-[15px] font-bold text-washon">💧 AUTOON Business</span>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-900">{businessName}</div>
        <div className="text-[11px] text-primary-600 mt-0.5">{businessHost}</div>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.filter((item) => {
          if (item.href === '/dashboard/admin') {
            return !isDemo && isAdminUser()
          }
          return true
        }).map((item) => {
          const Icon = ICONS[item.icon]
          const linkHref = href(item.href)
          const active =
            item.href === '/dashboard'
              ? pathname === linkHref
              : pathname === linkHref || pathname.startsWith(linkHref + '/')
          return (
            <Link
              key={item.href}
              href={linkHref}
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
