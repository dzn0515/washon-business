import type { SubscriptionPlanId } from './catalog'
import { checkoutSaasSubscription } from '@/lib/saas-billing-api'

export type ApplyPlanResult = {
  success: boolean
  planId: SubscriptionPlanId
}

export async function handleApplyPlan(
  planId: SubscriptionPlanId,
  opts?: { billingMethodId?: number; authKey?: string; autoRenewal?: boolean },
): Promise<ApplyPlanResult> {
  await checkoutSaasSubscription({
    plan_id: planId,
    billing_method_id: opts?.billingMethodId,
    auth_key: opts?.authKey,
    auto_renewal: opts?.autoRenewal ?? true,
  })
  return { success: true, planId }
}
