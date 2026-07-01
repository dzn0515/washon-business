'use client'

import { BellRing, X } from 'lucide-react'
import type { BookingReminderAlert } from '@/lib/booking-reminder/types'
import { REMINDER_STAGE_LABEL } from '@/lib/booking-reminder/types'

interface BookingReminderPopupProps {
  alert: BookingReminderAlert
  onDismiss: () => void
}

export default function BookingReminderPopup({ alert, onDismiss }: BookingReminderPopupProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 pointer-events-none">
      <div
        role="alertdialog"
        aria-labelledby="booking-reminder-title"
        aria-describedby="booking-reminder-desc"
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-blue-200 bg-white shadow-2xl ring-4 ring-blue-100/80"
      >
        <div className="flex items-start gap-3 border-b border-blue-50 bg-blue-600 px-5 py-4 rounded-t-2xl text-white">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
            <BellRing size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-100">{REMINDER_STAGE_LABEL[alert.stage]} 알림</p>
            <h2 id="booking-reminder-title" className="text-lg font-bold truncate">
              {alert.customerName} 고객 예약
            </h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="알림 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div id="booking-reminder-desc" className="space-y-3 px-5 py-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400 shrink-0">고객명</span>
            <span className="font-semibold text-gray-900 text-right">{alert.customerName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400 shrink-0">차량번호</span>
            <span className="font-semibold text-gray-900 text-right">{alert.carNumber}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400 shrink-0">예약 시간</span>
            <span className="font-semibold text-gray-900 text-right">{alert.bookingTime}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400 shrink-0">서비스</span>
            <span className="font-semibold text-gray-900 text-right">{alert.serviceName}</span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
