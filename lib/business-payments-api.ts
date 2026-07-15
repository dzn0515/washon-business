import { apiFetch } from '@/lib/api-client'

export type BusinessPayment = {
  id: number
  reservation_id: number | null
  provider: string
  status: string
  approved_amount: number
  canceled_amount: number
  balance_amount: number
  platform_fee_amount: number | null
  pg_fee_amount: number | null
  partner_settlement_amount: number | null
  approved_at: string | null
  plan_tier_snapshot: string | null
}

export type SettlementSummary = {
  today_payment_amount: number
  month_payment_amount: number
  refund_amount: number
  platform_fee_amount: number
  pg_fee_amount: number
  settlement_due_amount: number
  settlement_paid_amount: number
  payment_gateway: string
  payment_mode: string
}

export async function fetchBusinessPayments(page = 1) {
  return apiFetch<{ items: BusinessPayment[]; total: number }>(
    `/business/payments?page=${page}&pageSize=20`,
  )
}

export async function fetchSettlementSummary() {
  return apiFetch<SettlementSummary>('/business/settlement-summary')
}

export async function fetchBusinessSettlements() {
  return apiFetch<{ items: Array<Record<string, unknown>> }>('/business/settlements')
}

export async function fetchSettlementAccount() {
  return apiFetch<{
    bank_code: string
    account_number_masked: string
    account_holder: string
    verification_status: string
    payout_enabled: boolean
  } | null>('/business/settlement-account')
}

export async function fetchBillingMethods() {
  return apiFetch<{
    items: Array<{
      id: number
      provider: string
      card_company: string | null
      card_number_masked: string | null
      is_default: boolean
      status: string
    }>
    auto_billing_enabled: boolean
    payment_gateway: string
  }>('/business/billing-methods')
}
