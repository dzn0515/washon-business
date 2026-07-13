'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const PATH_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: '대시보드',
  businesses: '업체관리',
  reservations: '예약관리',
  cs: '고객센터',
  qr: 'QR관리',
  notices: '공지/알림',
  roles: '권한관리',
  customers: '고객관리',
  payments: '결제/정산',
  stats: '통계',
  reviews: '리뷰',
  settings: '운영설정',
  security: '보안',
  audit: '운영감사',
  system: '시스템',
  ai: 'AI',
  sales: '영업조직',
  distributors: '총판 관리',
  agencies: '영업점 관리',
  agents: '영업사원 관리',
  assignments: '업체 배정',
  commission: '수수료 정책',
  leads: '입점 신청 관리',
  franchises: '프랜차이즈',
}

export default function AdminBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500">
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/')
        const label = PATH_LABELS[seg] ?? seg
        const isLast = i === segments.length - 1

        return (
          <span key={href} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">/</span>}
            {isLast ? (
              <span className="text-gray-900 font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-blue-600 transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
