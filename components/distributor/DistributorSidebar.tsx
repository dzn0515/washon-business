'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuthSession } from '@/lib/api-client'
import { useDistributorPermissions } from '@/hooks/useDistributorPermissions'

const NAV = [
  { href: '/distributor', label: '대시보드', exact: true, key: 'dashboard' },
  { href: '/distributor/agencies', label: '영업점', key: 'agencies' },
  { href: '/distributor/agents', label: '영업사원', key: 'agents' },
  { href: '/distributor/partners', label: '업체', key: 'partners' },
  { href: '/distributor/leads', label: '입점 신청', key: 'leads' },
  { href: '/distributor/performance', label: '실적', key: 'performance' },
  { href: '/distributor/commission', label: '수수료', key: 'commission' },
  { href: '/distributor/settlements', label: '정산 내역', key: 'settlements' },
  { href: '/distributor/staff', label: '직원관리', key: 'staff' },
  { href: '/distributor/roles', label: '권한관리', key: 'roles' },
  { href: '/distributor/me', label: '내 정보', key: 'me' },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

type Props = {
  open: boolean
  onClose: () => void
}

export default function DistributorSidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { loaded, canView } = useDistributorPermissions()
  const visibleNav = loaded ? NAV.filter((item) => canView(item.key)) : NAV

  const handleLogout = () => {
    clearAuthSession()
    router.push('/distributor/login')
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={[
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-slate-900/20 bg-slate-950 text-slate-50 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-slate-800/60 px-5 py-5">
          <p className="text-lg font-bold tracking-tight text-white">AUTOON Distributor</p>
          <p className="mt-0.5 text-xs text-slate-300/80">총판 포털</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {visibleNav.map((item) => {
            const active = isActive(pathname, item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-500/20 text-indigo-200'
                    : 'text-slate-100/80 hover:bg-slate-900/60 hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-slate-800/60 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-700/80 px-3 py-2 text-sm text-slate-100 transition-colors hover:bg-slate-900"
          >
            로그아웃
          </button>
        </div>
      </aside>
    </>
  )
}
