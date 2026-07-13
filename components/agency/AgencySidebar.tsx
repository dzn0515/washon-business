'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuthSession } from '@/lib/api-client'

const NAV = [
  { href: '/agency', label: '대시보드', exact: true },
  { href: '/agency/agents', label: '영업사원' },
  { href: '/agency/partners', label: '업체' },
  { href: '/agency/leads', label: '입점 신청' },
  { href: '/agency/performance', label: '실적' },
  { href: '/agency/commission', label: '수수료' },
  { href: '/agency/me', label: '내 정보' },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

type Props = {
  open: boolean
  onClose: () => void
}

export default function AgencySidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearAuthSession()
    router.push('/agency/login')
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
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-emerald-900/20 bg-emerald-950 text-emerald-50 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-emerald-800/60 px-5 py-5">
          <p className="text-lg font-bold tracking-tight text-white">AUTOON Agency</p>
          <p className="mt-0.5 text-xs text-emerald-300/80">영업점 포털</p>
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
                    ? 'bg-teal-500/20 text-teal-200'
                    : 'text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-emerald-800/60 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-emerald-700/80 px-3 py-2 text-sm text-emerald-100 transition-colors hover:bg-emerald-900"
          >
            로그아웃
          </button>
        </div>
      </aside>
    </>
  )
}
