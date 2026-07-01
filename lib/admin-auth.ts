'use client'

import { getUserEmail } from '@/lib/api-client'

const ROLE_KEY = 'washon_mock_role'
const ADMIN_USER_KEY = 'washon_admin_user'

export interface AdminUser {
  id: string
  email: string
  name?: string
  role: string
}

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

export function isAdminRole(email: string, role?: string | null): boolean {
  if (role === 'admin' || role === 'ADMIN' || role === 'super_admin') return true
  return email.toLowerCase().startsWith('admin@')
}

export function persistAdminUser(user: AdminUser): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
}

export function loadAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(ADMIN_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

export function clearAdminUser(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(ADMIN_USER_KEY)
}
