'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: '/admin/sales', label: '대시보드', exact: true },
  { href: '/admin/sales/leads', label: '입점 신청' },
  { href: '/admin/sales/distributors', label: '총판' },
  { href: '/admin/sales/agencies', label: '영업점' },
  { href: '/admin/sales/agents', label: '영업사원' },
  { href: '/admin/sales/assignments', label: '업체 배정' },
  { href: '/admin/sales/commission', label: '수수료 정책' },
]

export default function SalesSubNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1.5">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
