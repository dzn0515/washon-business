import type { BusinessSubscription } from './types'

export type ToggleAutoRenewalResult = {
  success: boolean
  subscription: BusinessSubscription
  autoRenewal: boolean
}

/** Phase 3: Mock 자동 갱신 토글. 추후 API 연동 시 내부만 교체. */
export async function handleToggleAutoRenewal(
  subscription: BusinessSubscription,
): Promise<ToggleAutoRenewalResult> {
  const autoRenewal = !subscription.autoRenewal
  return {
    success: true,
    autoRenewal,
    subscription: { ...subscription, autoRenewal },
  }
}
