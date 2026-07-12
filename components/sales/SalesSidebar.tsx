'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuthSession } from '@/lib/api-client'

const NAV = [
  { href: '/sales', label: 'Dashboard', exact: true },
  { href: '/sales/partners', label: '내 업체' },
  { href: '/sales/apply', label: '입점 신청' },
  { href: '/sales/performance', label: '실적' },
  { href: '/sales/commission', label: '수수료' },
  { href: '/sales/me', label: '내 정보' },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

type Props = {
  open: boolean
  onClose: () => void
}

export default function SalesSidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearAuthSession()
    router.push('/sales/login')
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
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-teal-900/20 bg-teal-950 text-teal-50 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-teal-800/60 px-5 py-5">
          <p className="text-lg font-bold tracking-tight text-white">AUTOON Sales</p>
          <p className="mt-0.5 text-xs text-teal-300/80">영업 포털</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'text-teal-100/80 hover:bg-teal-900/60 hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-teal-800/60 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-teal-700/80 px-3 py-2 text-sm text-teal-100 transition-colors hover:bg-teal-900"
          >
            로그아웃
          </button>
        </div>
      </aside>
    </>
  )
}
