'use client'

import { useBookingReminderSettings } from '@/lib/booking-reminder/settings-store'
import { CARD } from '@/lib/dashboard-ui'

export default function BookingReminderSettingsPanel() {
  const soundEnabled = useBookingReminderSettings((s) => s.soundEnabled)
  const voiceEnabled = useBookingReminderSettings((s) => s.voiceEnabled)
  const setSoundEnabled = useBookingReminderSettings((s) => s.setSoundEnabled)
  const setVoiceEnabled = useBookingReminderSettings((s) => s.setVoiceEnabled)

  return (
    <div className={CARD}>
      <p className="text-[12px] text-gray-400 font-medium mb-1">예약 임박 알림</p>
      <p className="text-xs text-gray-500 mb-3">
        예약 30분 전, 10분 전, 예약 시간에 PC 팝업·알림음·말소리로 안내합니다.
      </p>
      <div className="space-y-3">
        <label className="flex items-center justify-between text-sm">
          <span className="text-gray-700">알림음</span>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="rounded text-blue-600"
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span className="text-gray-700">말소리(TTS)</span>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
            className="rounded text-blue-600"
          />
        </label>
      </div>
    </div>
  )
}
