import { createHistoryEntry, resolveStatusOnApprove, todayIso } from './utils'
import type { AdminAdApplication } from './types'

export type ApproveApplicationInput = {
  application: AdminAdApplication
  startDate: string
  endDate: string
  adminMemo: string
  today?: string
}

export type ApproveApplicationResult = {
  success: boolean
  application: AdminAdApplication
  nextStatus: AdminAdApplication['status']
}

/** Phase 2: Mock 승인 처리. 추후 API 연동 시 이 함수 내부만 교체. */
export async function handleApproveApplication(
  input: ApproveApplicationInput,
): Promise<ApproveApplicationResult> {
  const { application, startDate, endDate, adminMemo, today = todayIso() } = input

  if (!startDate || !endDate) {
    return { success: false, application, nextStatus: application.status }
  }
  if (startDate > endDate) {
    return { success: false, application, nextStatus: application.status }
  }

  const nextStatus = resolveStatusOnApprove(startDate, today)
  const note =
    nextStatus === 'ACTIVE'
      ? `승인 · 즉시 진행 (${startDate} ~ ${endDate})`
      : `승인 · 시작 예정 (${startDate} ~ ${endDate})`

  const updated: AdminAdApplication = {
    ...application,
    status: nextStatus,
    startDate,
    endDate,
    adminMemo,
    statusHistory: [
      ...application.statusHistory,
      createHistoryEntry(nextStatus, note, 'admin'),
    ],
  }

  return { success: true, application: updated, nextStatus }
}
