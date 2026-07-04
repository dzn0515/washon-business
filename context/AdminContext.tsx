'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getAccessToken, getUserEmail, restoreTokenFromSession } from '@/lib/api-client'
import {
  type AdminUser,
  loadAdminUser,
  persistAdminUser,
  clearAdminUser,
  getMockRole,
} from '@/lib/admin-auth'

interface AdminContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  favorites: string[]
  toggleFavorite: (href: string) => void
  isFavorite: (href: string) => boolean
  sidebarSearch: string
  setSidebarSearch: (q: string) => void
  adminUser: AdminUser | null
  setAdminUser: (user: AdminUser | null) => void
  isAuthenticated: boolean
}

const AdminContext = createContext<AdminContextType | null>(null)

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false
  restoreTokenFromSession()
  return !!getAccessToken()
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [favorites, setFavorites] = useState<string[]>([])
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [adminUser, setAdminUserState] = useState<AdminUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!hasAuthToken()) return
    const stored = loadAdminUser()
    if (stored) {
      setAdminUserState(stored)
    } else {
      const email = getUserEmail()
      if (email) {
        setAdminUserState({ id: '', email, role: getMockRole() })
      }
    }
    setIsAuthenticated(true)
  }, [])

  const setAdminUser = (user: AdminUser | null) => {
    setAdminUserState(user)
    if (user) {
      persistAdminUser(user)
      setIsAuthenticated(true)
    } else {
      clearAdminUser()
      setIsAuthenticated(false)
    }
  }

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))

  const toggleFavorite = (href: string) =>
    setFavorites((prev) =>
      prev.includes(href) ? prev.filter((f) => f !== href) : [...prev, href],
    )

  const isFavorite = (href: string) => favorites.includes(href)

  return (
    <AdminContext.Provider
      value={{
        theme,
        toggleTheme,
        favorites,
        toggleFavorite,
        isFavorite,
        sidebarSearch,
        setSidebarSearch,
        adminUser,
        setAdminUser,
        isAuthenticated,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
