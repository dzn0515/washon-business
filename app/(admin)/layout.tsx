'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminProvider } from '@/context/AdminContext'
import AdminShell from '@/components/admin/AdminShell'

const PUBLIC_PATHS = ['/admin/login']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setChecked(true)
      return
    }

    const token =
      sessionStorage.getItem('washon_access_token') ?? localStorage.getItem('access_token')

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
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  )
}
