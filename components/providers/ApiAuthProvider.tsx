'use client'

import { useEffect } from 'react'
import { ensureLoggedIn, restoreTokenFromSession } from '@/lib/api-client'

export default function ApiAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    restoreTokenFromSession()
    ensureLoggedIn().catch(() => {})
  }, [])

  return <>{children}</>
}
