'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, List, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

const items = [
  { href: '/dashboard', label: '홈', icon: LayoutDashboard },
  { href: '/dashboard/reservations', label: '예약', icon: Calendar },
  { href: '/dashboard/menus', label: '메뉴', icon: List },
  { href: '/dashboard/customers', label: '고객', icon: Users },
  { href: '/dashboard/settings', label: '설정', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { href } = useDemoMode()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100 lg:hidden safe-area-pb">
      <div className="flex">
        {items.map(({ href: itemHref, label, icon: Icon }) => {
          const linkHref = href(itemHref)
          const active =
            pathname === linkHref || (itemHref !== '/dashboard' && pathname.startsWith(linkHref))
          return (
            <Link
              key={itemHref}
              href={linkHref}
              className={cn(
                'flex-1 flex flex-col items-center py-2 text-[10px] gap-0.5',
                active ? 'text-blue-600 font-medium' : 'text-gray-400'
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
