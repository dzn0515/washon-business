'use client'

import { getUserEmail } from '@/lib/api-client'

const ROLE_KEY = 'washon_mock_role'

export function getMockRole(): 'admin' | 'owner' | 'customer' {
  if (typeof window === 'undefined') return 'admin'
  const stored = sessionStorage.getItem(ROLE_KEY)
  if (stored === 'admin' || stored === 'owner' || stored === 'customer') return stored
  const email = getUserEmail()
  if (email?.includes('admin@')) return 'admin'
  return 'owner'
}

export function setMockRole(role: 'admin' | 'owner' | 'customer'): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ROLE_KEY, role)
}

export function isMockAdmin(): boolean {
  return getMockRole() === 'admin'
}
