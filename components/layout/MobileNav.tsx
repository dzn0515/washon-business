'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, List, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: '홈', icon: LayoutDashboard },
  { href: '/bookings', label: '예약', icon: Calendar },
  { href: '/menus', label: '메뉴', icon: List },
  { href: '/customers', label: '고객', icon: Users },
  { href: '/settings/hours', label: '설정', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 lg:hidden safe-area-pb">
      <div className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center py-2 text-[10px] gap-0.5',
                active ? 'text-primary-600 font-medium' : 'text-gray-400'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
