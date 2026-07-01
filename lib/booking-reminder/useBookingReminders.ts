'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchBusinessBookings, type ApiMenu } from '@/lib/bookings-api'
import { apiFetch } from '@/lib/api-client'
import { getToken } from '@/lib/auth'
import { hasReminderFired, markReminderFired } from '@/lib/booking-reminder/dedup'
import { playBookingAlertSound } from '@/lib/booking-reminder/play-alert-sound'
import { useBookingReminderSettings } from '@/lib/booking-reminder/settings-store'
import { primeSpeechVoices, speakBookingAlert } from '@/lib/booking-reminder/speak-alert'
import type { BookingReminderAlert } from '@/lib/booking-reminder/types'
import {
  buildReminderAlert,
  detectReminderStage,
  isActiveBookingStatus,
} from '@/lib/booking-reminder/utils'
import { todayIso } from '@/lib/api-mappers'

const POLL_MS = 30_000

function focusElectronWindow(): void {
  window.electronAPI?.showBookingAlert?.()
}

async function deliverAlertEffects(
  alert: BookingReminderAlert,
  soundEnabled: boolean,
  voiceEnabled: boolean,
): Promise<void> {
  focusElectronWindow()
  if (soundEnabled) {
    await playBookingAlertSound().catch(() => {})
  }
  if (voiceEnabled) {
    speakBookingAlert(alert.voiceText)
  }
}

export function useBookingReminders() {
  const soundEnabled = useBookingReminderSettings((s) => s.soundEnabled)
  const voiceEnabled = useBookingReminderSettings((s) => s.voiceEnabled)
  const [activeAlert, setActiveAlert] = useState<BookingReminderAlert | null>(null)
  const queueRef = useRef<BookingReminderAlert[]>([])
  const checkingRef = useRef(false)

  const pumpQueue = useCallback(() => {
    setActiveAlert((current) => {
      if (current) return current
      const next = queueRef.current.shift()
      return next ?? null
    })
  }, [])

  const enqueueAlert = useCallback((alert: BookingReminderAlert) => {
    queueRef.current.push(alert)
    pumpQueue()
  }, [pumpQueue])

  const dismissAlert = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setActiveAlert(null)
    window.setTimeout(() => pumpQueue(), 300)
  }, [pumpQueue])

  useEffect(() => {
    primeSpeechVoices()
  }, [])

  useEffect(() => {
    if (!activeAlert) return
    void deliverAlertEffects(activeAlert, soundEnabled, voiceEnabled)
  }, [activeAlert, soundEnabled, voiceEnabled])

  const checkReminders = useCallback(async () => {
    if (checkingRef.current) return
    if (!getToken()) return

    checkingRef.current = true
    try {
      const today = todayIso()
      const [bookings, menus] = await Promise.all([
        fetchBusinessBookings(today),
        apiFetch<ApiMenu[]>('/business/menus/'),
      ])
      const menuMap = Object.fromEntries(menus.map((m) => [m.id, m]))
      const now = new Date()

      for (const booking of bookings) {
        if (!isActiveBookingStatus(booking.status)) continue
        const stage = detectReminderStage(booking.booking_date, booking.start_time, now)
        if (!stage) continue
        if (hasReminderFired(booking.id, stage, booking.booking_date)) continue

        markReminderFired(booking.id, stage, booking.booking_date)
        enqueueAlert(buildReminderAlert(booking, menuMap, stage))
      }
    } catch (e) {
      console.log('[BookingReminder] check failed', e)
    } finally {
      checkingRef.current = false
    }
  }, [enqueueAlert])

  useEffect(() => {
    if (!getToken()) return

    void checkReminders()
    const timer = window.setInterval(() => {
      void checkReminders()
    }, POLL_MS)

    return () => window.clearInterval(timer)
  }, [checkReminders])

  return { activeAlert, dismissAlert }
}
