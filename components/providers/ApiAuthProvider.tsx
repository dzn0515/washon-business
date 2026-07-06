'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ensureLoggedIn, restoreTokenFromSession } from '@/lib/api-client'

const PUBLIC_PATHS = ['/', '/login', '/register', '/pending', '/join', '/about', '/delete-account']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname === '/demo' || pathname.startsWith('/demo/')) return true
  return pathname.startsWith('/install') || /^[^?]*\/[^/]+\/booking/.test(pathname)
}

export default function ApiAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    restoreTokenFromSession()
    if (ensureLoggedIn() || isPublicPath(pathname)) {
      setChecked(true)
      return
    }
    router.replace(pathname.startsWith('/admin') ? '/admin/login' : '/login')
  }, [pathname, router])

  if (isPublicPath(pathname)) {
    return <>{children}</>
  }

  if (!checked || !ensureLoggedIn()) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-400">
        로그인 확인 중...
      </div>
    )
  }

  return <>{children}</>
}
