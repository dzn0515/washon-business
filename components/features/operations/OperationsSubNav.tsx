'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

const LINKS = [
  { href: '/dashboard/operations/calendar', label: '운영 캘린더' },
  { href: '/dashboard/operations/bays', label: '베이 관리' },
  { href: '/dashboard/operations/staff', label: '직원 관리' },
] as const

export default function OperationsSubNav() {
  const pathname = usePathname()
  const { isDemo } = useDemoMode()

  if (isDemo) return null

  return (
    <div className="flex gap-2 border-b border-gray-100 pb-3">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm border transition-colors',
            pathname.startsWith(link.href)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'text-gray-500 border-gray-200 hover:bg-gray-50',
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}
