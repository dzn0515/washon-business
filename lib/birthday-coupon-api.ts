import { apiFetch } from '@/lib/api-client'

export type BirthdayCouponSettings = {
  business_id: string
  discount_type: 'amount' | 'percent'
  discount_value: number
  validity_days: number
  min_order_amount: number | null
  updated_at: string | null
}

export type BirthdayCouponMetrics = {
  issued_this_month: number
  used_this_month: number
  usage_rate_pct: number
}

export type BirthdayCouponIssuance = {
  id: string
  issued_at: string
  customer_name_masked: string
  coupon_summary: string
  status: 'issued' | 'used' | 'expired' | 'cancelled'
  used_at: string | null
}

export type BirthdayCouponIssuanceList = {
  items: BirthdayCouponIssuance[]
  total: number
  page: number
  page_size: number
}

export type BirthdayCouponSettingsPayload = {
  discount_type: 'amount' | 'percent'
  discount_value: number
  validity_days: number
  min_order_amount?: number | null
}

export async function fetchBirthdayCouponSettings() {
  return apiFetch<BirthdayCouponSettings | null>('/business/birthday-coupon/settings')
}

export async function saveBirthdayCouponSettings(data: BirthdayCouponSettingsPayload) {
  return apiFetch<BirthdayCouponSettings>('/business/birthday-coupon/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function fetchBirthdayCouponMetrics() {
  return apiFetch<BirthdayCouponMetrics>('/business/birthday-coupon/metrics')
}

export async function fetchBirthdayCouponIssuances(params: {
  month?: string
  page?: number
  page_size?: number
}) {
  const qs = new URLSearchParams()
  if (params.month) qs.set('month', params.month)
  if (params.page) qs.set('page', String(params.page))
  if (params.page_size) qs.set('page_size', String(params.page_size))
  const query = qs.toString()
  return apiFetch<BirthdayCouponIssuanceList>(
    `/business/birthday-coupon/issuances${query ? `?${query}` : ''}`,
  )
}
