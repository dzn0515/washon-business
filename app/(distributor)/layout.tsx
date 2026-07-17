'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DistributorShell from '@/components/distributor/DistributorShell'
import { getAccessToken, restoreTokenFromSession } from '@/lib/api-client'
import {
  DistributorPermissionProvider,
  useDistributorPermissions,
} from '@/hooks/useDistributorPermissions'
import { menuKeyForPath } from '@/lib/distributor-menu-registry'

const PUBLIC_PATHS = ['/distributor/login']

function DistributorPathGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { loaded, canView, firstAllowedHref, staffRole } = useDistributorPermissions()

  useEffect(() => {
    if (!loaded) return
    if (PUBLIC_PATHS.includes(pathname)) return
    const key = menuKeyForPath(pathname)
    if (!key) return
    if (!canView(key)) {
      if (firstAllowedHref && firstAllowedHref !== pathname) {
        router.replace(firstAllowedHref)
      }
    }
  }, [loaded, pathname, canView, firstAllowedHref, router])

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-stone-400">
        권한 확인 중...
      </div>
    )
  }

  if (!staffRole) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-red-600">
        접근 권한이 설정되지 않았습니다.
      </div>
    )
  }

  const key = menuKeyForPath(pathname)
  if (key && !canView(key)) {
    if (firstAllowedHref && firstAllowedHref !== pathname) {
      return null
    }
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-stone-500">
        이 메뉴에 대한 조회 권한이 없습니다.
      </div>
    )
  }

  return <>{children}</>
}

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setChecked(true)
      return
    }

    restoreTokenFromSession()
    const token = getAccessToken()

    if (!token) {
      router.replace('/distributor/login')
      return
    }

    setChecked(true)
  }, [pathname, router])

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-stone-400">
        권한 확인 중...
      </div>
    )
  }

  return (
    <DistributorPermissionProvider>
      <DistributorPathGuard>
        <DistributorShell>{children}</DistributorShell>
      </DistributorPathGuard>
    </DistributorPermissionProvider>
  )
}
