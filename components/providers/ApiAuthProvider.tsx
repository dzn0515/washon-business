'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ensureLoggedIn, restoreTokenFromSession } from '@/lib/api-client'

const PUBLIC_PATHS = ['/', '/login', '/register', '/pending', '/join', '/about', '/delete-account']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return pathname.startsWith('/install') || /^[^?]*\/[^/]+\/booking/.test(pathname)
}

export default function ApiAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    restoreTokenFromSession()
    if (ensureLoggedIn() || isPublicPath(pathname)) return
    router.replace(pathname.startsWith('/admin') ? '/admin/login' : '/login')
  }, [pathname, router])

  return <>{children}</>
}
