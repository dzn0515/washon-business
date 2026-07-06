'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import { formatResourceManageTitle } from '@/lib/resource-label'

export default function OperationsSubNav() {
  const pathname = usePathname()
  const { isDemo } = useDemoMode()
  const { display: businessDisplay } = useBusinessMe()
  const resourceManage = formatResourceManageTitle(
    businessDisplay?.bizType,
    businessDisplay?.resourceLabel,
  )

  const links = [
    { href: '/dashboard/operations/calendar', label: '운영 캘린더' },
    { href: '/dashboard/operations/bays', label: resourceManage },
    { href: '/dashboard/operations/staff', label: '직원 관리' },
  ] as const

  if (isDemo) return null

  return (
    <div className="flex gap-2 border-b border-gray-100 pb-3">
      {links.map((link) => (
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
