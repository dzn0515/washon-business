import type { BusinessSubscription } from './types'
import { patchSaasAutoRenewal } from '@/lib/saas-billing-api'

export type ToggleAutoRenewalResult = {
  success: boolean
  subscription: BusinessSubscription
  autoRenewal: boolean
}

export async function handleToggleAutoRenewal(
  subscription: BusinessSubscription,
): Promise<ToggleAutoRenewalResult> {
  const overview = await patchSaasAutoRenewal(!subscription.autoRenewal)
  return {
    success: true,
    autoRenewal: overview.autoRenewal,
    subscription: overview,
  }
}
