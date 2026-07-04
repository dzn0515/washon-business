import { create } from 'zustand'
import type { Business } from '@/types'
import { setToken } from '@/lib/auth'
import { clearAuthSession } from '@/lib/api-client'
import { toBusinessEntity } from '@/lib/mock/data'

interface AuthState {
  user: { id: number; name: string; email: string } | null
  business: Business | null
  isLoading: boolean
  login: (provider: 'kakao' | 'google' | 'naver') => Promise<void>
  logout: () => void
  loadBusiness: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  business: null,
  isLoading: false,

  login: async (provider) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 500))
    setToken(`mock_${provider}_token`)
    set({
      user: { id: 1, name: '사장님', email: 'owner@washon.kr' },
      business: toBusinessEntity(),
      isLoading: false,
    })
  },

  logout: () => {
    clearAuthSession()
    set({ user: null, business: null })
  },

  loadBusiness: async () => {
    set({ business: toBusinessEntity() })
  },
}))
