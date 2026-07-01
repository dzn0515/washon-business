'use client'

import { updateBookingStatus } from '@/lib/api'
import type { BookingStatus } from '@/types'

const STATUS_ACTIONS: Record<string, { label: string; next: BookingStatus; color: string }[]> = {
  pending: [
    { label: '예약 확정', next: 'confirmed', color: 'blue' },
    { label: '취소', next: 'cancelled', color: 'red' },
  ],
  confirmed: [
    { label: '입차 확인', next: 'arrived', color: 'purple' },
    { label: '취소', next: 'cancelled', color: 'red' },
  ],
  arrived: [{ label: '작업 시작', next: 'in_progress', color: 'orange' }],
  in_progress: [{ label: '작업 완료', next: 'completed', color: 'green' }],
  completed: [{ label: '결제 완료', next: 'paid', color: 'green' }],
  paid: [],
  reviewed: [],
  cancelled: [],
  noshow: [],
  waiting: [
    { label: '예약 확정', next: 'confirmed', color: 'blue' },
    { label: '취소', next: 'cancelled', color: 'red' },
  ],
}

const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  green: 'bg-green-600 hover:bg-green-700 text-white',
  orange: 'bg-orange-500 hover:bg-orange-600 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  red: 'border border-red-300 text-red-600 hover:bg-red-50',
}

interface Props {
  bookingId: string
  status: BookingStatus
  onStatusChange: (newStatus: BookingStatus) => void
  disabled?: boolean
}

export default function BookingStatusActions({
  bookingId,
  status,
  onStatusChange,
  disabled,
}: Props) {
  const actions = STATUS_ACTIONS[status] ?? []
  if (actions.length === 0) return null

  const handleAction = async (next: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, next)
      onStatusChange(next)
    } catch {
      alert('상태 변경에 실패했습니다.')
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.next}
          type="button"
          disabled={disabled}
          onClick={() => handleAction(action.next)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${COLOR_CLASSES[action.color]}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
