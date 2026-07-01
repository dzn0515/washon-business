import { apiFetch } from '@/lib/api-client'

export type ApiCoupon = {
  id: string
  business_id: string
  name: string
  discount_type: 'amount' | 'percent'
  discount_value: number
  min_order_amount: number
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
}

export type ApiCustomerCoupon = {
  id: string
  coupon_id: string
  customer_id: string
  coupon_name: string
  discount_type: 'amount' | 'percent'
  discount_value: number
  min_order_amount: number
  valid_from: string
  valid_until: string
  booking_id: string | null
  issued_at: string
  used_at: string | null
  status: 'issued' | 'used' | 'expired' | 'cancelled'
}

export type CouponPayload = {
  name: string
  discount_type: 'amount' | 'percent'
  discount_value: number
  min_order_amount: number
  valid_from: string
  valid_until: string
  is_active?: boolean
}

export async function fetchCoupons() {
  return apiFetch<ApiCoupon[]>('/business/coupons')
}

export async function createCoupon(data: CouponPayload) {
  return apiFetch<ApiCoupon>('/business/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCoupon(id: string, data: Partial<CouponPayload>) {
  return apiFetch<ApiCoupon>(`/business/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function setCouponActive(id: string, is_active: boolean) {
  return apiFetch<ApiCoupon>(`/business/coupons/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  })
}

export async function fetchCustomerCoupons(customerId: string) {
  return apiFetch<ApiCustomerCoupon[]>(`/business/customers/${customerId}/coupons`)
}

export async function issueCustomerCoupon(customerId: string, couponId: string) {
  return apiFetch<ApiCustomerCoupon>(`/business/customers/${customerId}/coupons`, {
    method: 'POST',
    body: JSON.stringify({ coupon_id: couponId }),
  })
}

export async function markCustomerCouponUsed(customerCouponId: string, bookingId?: string) {
  return apiFetch<ApiCustomerCoupon>(`/business/customer-coupons/${customerCouponId}/use`, {
    method: 'PUT',
    body: JSON.stringify({ booking_id: bookingId ?? null }),
  })
}
