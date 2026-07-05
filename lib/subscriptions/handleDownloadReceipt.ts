import type { BusinessPaymentRecord } from './types'

export type DownloadReceiptResult = {
  success: boolean
  recordId: string
}

/** Phase 3: Mock 영수증 다운로드. 추후 API/PG 연동 시 내부만 교체. */
export async function handleDownloadReceipt(
  record: BusinessPaymentRecord,
): Promise<DownloadReceiptResult> {
  return { success: true, recordId: record.id }
}
