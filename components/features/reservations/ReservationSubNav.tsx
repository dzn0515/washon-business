'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

const LINKS = [
  { href: '/dashboard/reservations', label: '예약 목록' },
  { href: '/dashboard/reservations/calendar', label: '베이 캘린더' },
] as const

export default function ReservationSubNav() {
  const pathname = usePathname()
  const { isDemo } = useDemoMode()

  if (isDemo) return null

  return (
    <div className="flex gap-2 border-b border-gray-100 pb-3">
      {LINKS.map((link) => {
        const active =
          link.href === '/dashboard/reservations'
            ? pathname === '/dashboard/reservations'
            : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm border transition-colors',
              active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-500 border-gray-200 hover:bg-gray-50',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}
