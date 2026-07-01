'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BookingReminderSettingsState {
  soundEnabled: boolean
  voiceEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  setVoiceEnabled: (enabled: boolean) => void
}

export const useBookingReminderSettings = create<BookingReminderSettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      voiceEnabled: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
    }),
    { name: 'washon-booking-reminder-settings' },
  ),
)
