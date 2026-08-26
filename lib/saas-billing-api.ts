import { apiFetch } from '@/lib/api-client'
import type { BusinessSubscription } from '@/lib/subscriptions/types'

export type SaasBillingQuote = {
  kind: 'subscription' | 'ad'
  plan_id?: string
  plan_tier?: string
  plan_name?: string
  product_id?: string
  product_name?: string
  order_name: string
  supply_amount: number
  vat_amount: number
  charge_amount: number
  vat_rate_percent: number
  billing_cycle: string
  service_period_label: string
  auto_billing: boolean
  vat_excluded: boolean
  requires_admin_approval?: boolean
}

export type SaasBillingConfig = {
  customer_key: string
  client_key: string
  payment_gateway: string
  payment_mode: string
  billing_available: boolean
  widget: 'requestBillingAuth' | 'mock' | string
  auto_billing_enabled: boolean
}

export type SaasBillingMethod = {
  id: number
  provider: string
  card_company: string | null
  card_number_masked: string | null
  is_default: boolean
  status: string
}

export type SaasSubscriptionOverview = BusinessSubscription & {
  plan_tier?: string
  quote?: SaasBillingQuote
  billingMethods?: SaasBillingMethod[]
  monthlyFee?: number
  currentPeriodEndsAt?: string | null
}

export async function fetchSaasBillingConfig() {
  return apiFetch<SaasBillingConfig>('/business/billing/config')
}

export async function fetchSaasBillingQuote(params: {
  kind: 'subscription' | 'ad'
  planId?: string
  productId?: string
}) {
  const qs = new URLSearchParams({ kind: params.kind })
  if (params.planId) qs.set('plan_id', params.planId)
  if (params.productId) qs.set('product_id', params.productId)
  return apiFetch<SaasBillingQuote>(`/business/billing/quote?${qs.toString()}`)
}

export async function fetchSaasSubscription() {
  return apiFetch<SaasSubscriptionOverview>('/business/subscription')
}

export async function patchSaasAutoRenewal(autoRenewal: boolean) {
  return apiFetch<SaasSubscriptionOverview>('/business/subscription/auto-renewal', {
    method: 'PATCH',
    body: JSON.stringify({ auto_renewal: autoRenewal }),
  })
}

export async function checkoutSaasSubscription(body: {
  plan_id: string
  billing_method_id?: number
  auth_key?: string
  customer_key?: string
  auto_renewal?: boolean
}) {
  return apiFetch<{
    ok: boolean
    kind: 'subscription'
    quote: SaasBillingQuote
    subscription: SaasSubscriptionOverview
    billing_method: SaasBillingMethod
  }>('/business/subscriptions/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function checkoutSaasAd(body: {
  product_id: string
  billing_method_id?: number
  auth_key?: string
  customer_key?: string
  applicant_memo?: string
}) {
  return apiFetch<{
    ok: boolean
    kind: 'ad'
    quote: SaasBillingQuote
    application: { id: string; productId: string; status: string }
    billing_method: SaasBillingMethod
  }>('/business/ads/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
