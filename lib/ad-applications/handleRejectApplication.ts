import { createHistoryEntry } from './utils'
import type { AdminAdApplication } from './types'

export type RejectApplicationInput = {
  application: AdminAdApplication
  rejectReason: string
  adminMemo: string
}

export type RejectApplicationResult = {
  success: boolean
  application: AdminAdApplication
}

/** Phase 2: Mock 반려 처리. 추후 API 연동 시 이 함수 내부만 교체. */
export async function handleRejectApplication(
  input: RejectApplicationInput,
): Promise<RejectApplicationResult> {
  const { application, rejectReason, adminMemo } = input

  if (!rejectReason.trim()) {
    return { success: false, application }
  }

  const updated: AdminAdApplication = {
    ...application,
    status: 'REJECTED',
    rejectReason: rejectReason.trim(),
    adminMemo,
    startDate: null,
    endDate: null,
    statusHistory: [
      ...application.statusHistory,
      createHistoryEntry('REJECTED', `반려: ${rejectReason.trim()}`, 'admin'),
    ],
  }

  return { success: true, application: updated }
}
