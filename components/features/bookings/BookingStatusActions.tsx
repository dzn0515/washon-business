'use client'

import { getStatusActions } from '@/lib/booking-status-ui'
import type { BookingStatus } from '@/types'

type Props = {
  status: BookingStatus
  disabled?: boolean
  onAction: (status: BookingStatus) => void
}

export default function BookingStatusActions({ status, disabled, onAction }: Props) {
  const actions = getStatusActions(status)
  if (actions.length === 0) {
    return <span className="text-xs text-gray-400">처리 완료</span>
  }
  return (
    <div className="flex gap-1.5 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={disabled}
          onClick={() => onAction(action.status)}
          className={`text-xs px-2.5 py-1 rounded-lg border disabled:opacity-50 ${action.className}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
