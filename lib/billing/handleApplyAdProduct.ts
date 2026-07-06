import type { AdProduct } from './catalog'
import { applyBusinessAdProducts } from '@/lib/mock/business-ad-products'

export type ApplyAdProductResult = {
  success: boolean
  items: AdProduct[]
  summary?: ReturnType<typeof applyBusinessAdProducts>
}

/**
 * 상품 신청 접수 — 서버 응답 확인 후 상태 갱신 (Phase 1: mock store).
 * 노출 확장 상위 선택 시 기존 pending 노출 건은 CANCELLED(available) 처리.
 */
export async function handleApplyAdProduct(items: AdProduct[]): Promise<ApplyAdProductResult> {
  if (items.length === 0) {
    return { success: false, items: [] }
  }

  await new Promise((resolve) => setTimeout(resolve, 400))

  const summary = applyBusinessAdProducts(items)
  return { success: true, items, summary }
}
