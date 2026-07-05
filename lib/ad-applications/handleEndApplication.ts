import { createHistoryEntry } from './utils'
import type { AdminAdApplication } from './types'

export type EndApplicationInput = {
  application: AdminAdApplication
  adminMemo?: string
}

export type EndApplicationResult = {
  success: boolean
  application: AdminAdApplication
}

/** Phase 2: Mock 종료 처리. 추후 API 연동 시 이 함수 내부만 교체. */
export async function handleEndApplication(
  input: EndApplicationInput,
): Promise<EndApplicationResult> {
  const { application, adminMemo } = input

  if (application.status !== 'ACTIVE' && application.status !== 'APPROVED') {
    return { success: false, application }
  }

  const updated: AdminAdApplication = {
    ...application,
    status: 'ENDED',
    adminMemo: adminMemo ?? application.adminMemo,
    statusHistory: [
      ...application.statusHistory,
      createHistoryEntry('ENDED', '관리자 수동 종료 처리', 'admin'),
    ],
  }

  return { success: true, application: updated }
}
