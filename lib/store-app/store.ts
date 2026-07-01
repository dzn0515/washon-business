'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDefaultStoreAppProfile } from '@/lib/store-app/defaults'
import type {
  StoreAppCoupon,
  StoreAppEvent,
  StoreAppInfo,
  StoreAppProfile,
  StoreAppService,
} from '@/types/store-app'

let nextId = 1000
function uid() {
  nextId += 1
  return String(nextId)
}

interface StoreAppState {
  profile: StoreAppProfile
  setStore: (partial: Partial<StoreAppInfo>) => void
  updateService: (id: string, partial: Partial<StoreAppService>) => void
  addService: () => void
  removeService: (id: string) => void
  updateCoupon: (id: string, partial: Partial<StoreAppCoupon>) => void
  addCoupon: () => void
  removeCoupon: (id: string) => void
  updateEvent: (id: string, partial: Partial<StoreAppEvent>) => void
  addEvent: () => void
  removeEvent: (id: string) => void
  resetProfile: () => void
}

export const useStoreApp = create<StoreAppState>()(
  persist(
    (set) => ({
      profile: createDefaultStoreAppProfile(),

      setStore: (partial) =>
        set((s) => ({ profile: { ...s.profile, store: { ...s.profile.store, ...partial } } })),

      updateService: (id, partial) =>
        set((s) => ({
          profile: {
            ...s.profile,
            services: s.profile.services.map((item) =>
              item.id === id ? { ...item, ...partial } : item
            ),
          },
        })),

      addService: () =>
        set((s) => ({
          profile: {
            ...s.profile,
            services: [
              ...s.profile.services,
              {
                id: uid(),
                name: '새 서비스',
                description: '',
                durationMinutes: 40,
                price: 25000,
                isVisible: true,
              },
            ],
          },
        })),

      removeService: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            services: s.profile.services.filter((item) => item.id !== id),
          },
        })),

      updateCoupon: (id, partial) =>
        set((s) => ({
          profile: {
            ...s.profile,
            coupons: s.profile.coupons.map((item) =>
              item.id === id ? { ...item, ...partial } : item
            ),
          },
        })),

      addCoupon: () =>
        set((s) => ({
          profile: {
            ...s.profile,
            coupons: [
              ...s.profile.coupons,
              {
                id: uid(),
                name: '새 쿠폰',
                discountType: 'FIXED',
                discountValue: 3000,
                validFrom: '2026-06-01',
                validUntil: '2026-12-31',
                description: '',
                isVisible: true,
              },
            ],
          },
        })),

      removeCoupon: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            coupons: s.profile.coupons.filter((item) => item.id !== id),
          },
        })),

      updateEvent: (id, partial) =>
        set((s) => ({
          profile: {
            ...s.profile,
            events: s.profile.events.map((item) =>
              item.id === id ? { ...item, ...partial } : item
            ),
          },
        })),

      addEvent: () =>
        set((s) => ({
          profile: {
            ...s.profile,
            events: [
              ...s.profile.events,
              {
                id: uid(),
                title: '새 이벤트',
                description: '',
                period: '2026.06.01 ~ 2026.12.31',
                isVisible: true,
              },
            ],
          },
        })),

      removeEvent: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            events: s.profile.events.filter((item) => item.id !== id),
          },
        })),

      resetProfile: () => set({ profile: createDefaultStoreAppProfile() }),
    }),
    { name: 'washon-store-app-profile' }
  )
)
