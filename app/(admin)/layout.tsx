'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminProvider } from '@/context/AdminContext'
import AdminShell from '@/components/admin/AdminShell'
import { AdminPermissionProvider, usePermissionMap } from '@/hooks/useAdminPermissions'
import { getAccessToken, restoreTokenFromSession } from '@/lib/api-client'
import { menuKeyForPath } from '@/lib/admin-menu-registry'

const PUBLIC_PATHS = ['/admin/login']
const CHANGE_PASSWORD_PATH = '/admin/change-password'
const PERMISSION_EXEMPT_PATHS = [CHANGE_PASSWORD_PATH]

function AdminPathGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { loaded, canView, firstAllowedHref, role, passwordResetRequired } = usePermissionMap()

  useEffect(() => {
    if (!loaded) return
    if (PUBLIC_PATHS.includes(pathname)) return
    if (passwordResetRequired) {
      if (pathname !== CHANGE_PASSWORD_PATH) router.replace(CHANGE_PASSWORD_PATH)
      return
    }
    if (PERMISSION_EXEMPT_PATHS.includes(pathname)) return
    const key = menuKeyForPath(pathname)
    if (!key) return
    if (!canView(key)) {
      if (firstAllowedHref) router.replace(firstAllowedHref)
      else router.replace('/admin/login')
    }
  }, [loaded, pathname, canView, firstAllowedHref, router, passwordResetRequired])

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        권한 확인 중...
      </div>
    )
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-red-600">
        접근 권한이 설정되지 않았습니다.
      </div>
    )
  }

  if (passwordResetRequired) {
    if (pathname !== CHANGE_PASSWORD_PATH) return null
    return <>{children}</>
  }

  if (PERMISSION_EXEMPT_PATHS.includes(pathname)) {
    return <>{children}</>
  }

  const key = menuKeyForPath(pathname)
  if (key && !canView(key)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        이 메뉴에 대한 조회 권한이 없습니다.
      </div>
    )
  }

  return <>{children}</>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      router.replace('/admin/login')
      return
    }

    setChecked(true)
  }, [pathname, router])

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        권한 확인 중...
      </div>
    )
  }

  return (
    <AdminProvider>
      <AdminPermissionProvider>
        <AdminPathGuard>
          <AdminShell>{children}</AdminShell>
        </AdminPathGuard>
      </AdminPermissionProvider>
    </AdminProvider>
  )
}
