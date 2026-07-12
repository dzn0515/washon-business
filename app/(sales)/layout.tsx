'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import SalesShell from '@/components/sales/SalesShell'
import { getAccessToken, restoreTokenFromSession } from '@/lib/api-client'

const PUBLIC_PATHS = ['/sales/login']

export default function SalesLayout({ children }: { children: React.ReactNode }) {
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
      router.replace('/sales/login')
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

  return <SalesShell>{children}</SalesShell>
}
