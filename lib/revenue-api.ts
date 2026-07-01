import { apiFetch } from '@/lib/api-client'

export type ApiDailyRevenue = {
  date: string
  total_booking_amount: number
  paid_amount: number
  unpaid_amount: number
  refunded_amount: number
  app_pending_amount: number
  app_pending_count: number
  by_method: { onsite: number; app: number }
  items: Array<{
    booking_id: string
    booking_number: string
    customer_name: string
    menu_name: string
    booking_date: string
    start_time: string
    price: number
    payment_method: 'onsite' | 'app' | 'none'
    payment_status: 'unpaid' | 'paid' | 'refunded' | 'cancelled'
    paid_amount: number
    paid_at: string | null
    refunded_at: string | null
    app_order_id: string | null
    app_order_status: string | null
  }>
}

export async function fetchDailyRevenue(date: string) {
  return apiFetch<ApiDailyRevenue>(`/business/revenue/daily?date=${encodeURIComponent(date)}`)
}
