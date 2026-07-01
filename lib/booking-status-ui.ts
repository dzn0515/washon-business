import type { BookingStatus } from '@/types'

export type StatusAction = {
  status: BookingStatus
  label: string
  className: string
}

const TERMINAL: BookingStatus[] = ['completed', 'paid', 'reviewed', 'cancelled', 'noshow']

export function isTerminalStatus(status: BookingStatus): boolean {
  return TERMINAL.includes(status)
}

export function getStatusActions(status: BookingStatus): StatusAction[] {
  switch (status) {
    case 'pending':
    case 'waiting':
      return [
        { status: 'confirmed', label: '예약 확정', className: 'bg-blue-50 text-blue-700 border-blue-200' },
        { status: 'cancelled', label: '예약 취소', className: 'bg-red-50 text-red-700 border-red-200' },
      ]
    case 'confirmed':
      return [
        { status: 'arrived', label: '입차 확인', className: 'bg-purple-50 text-purple-700 border-purple-200' },
        { status: 'cancelled', label: '예약 취소', className: 'bg-red-50 text-red-700 border-red-200' },
        { status: 'noshow', label: '노쇼', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      ]
    case 'arrived':
      return [
        { status: 'in_progress', label: '작업 시작', className: 'bg-orange-50 text-orange-700 border-orange-200' },
      ]
    case 'in_progress':
      return [
        { status: 'completed', label: '작업 완료', className: 'bg-green-50 text-green-700 border-green-200' },
      ]
    case 'completed':
      return [
        { status: 'paid', label: '결제 완료', className: 'bg-green-50 text-green-700 border-green-200' },
      ]
    default:
      return []
  }
}

export function parseStatusTransitionError(e: unknown): boolean {
  const err = e as Error & { status?: number }
  return err.status === 400 && err.message === 'Invalid status transition'
}
