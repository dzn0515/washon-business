'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { isAuthenticated } from '@/lib/auth'

export function useAuth() {
  const router = useRouter()
  const { user, business, isLoading, login, logout, loadBusiness } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated() && !business) loadBusiness()
  }, [business, loadBusiness])

  const requireAuth = () => {
    if (!isAuthenticated()) router.push('/login')
  }

  return { user, business, isLoading, login, logout, requireAuth }
}
