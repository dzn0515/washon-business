import type { SubscriptionPlanId } from './catalog'

export type ApplyPlanResult = {
  success: boolean
  planId: SubscriptionPlanId
}

/** Phase 1: 신청 접수만. PG/API/DB 연결 없음. */
export async function handleApplyPlan(planId: SubscriptionPlanId): Promise<ApplyPlanResult> {
  return { success: true, planId }
}
