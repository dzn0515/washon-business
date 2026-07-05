import type { AdProduct } from './catalog'

export type ApplyAdProductResult = {
  success: boolean
  items: AdProduct[]
}

/** Phase 1: 신청 접수만. PG/API/DB 연결 없음. */
export async function handleApplyAdProduct(items: AdProduct[]): Promise<ApplyAdProductResult> {
  return { success: true, items }
}
