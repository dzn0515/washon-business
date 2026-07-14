import { apiFetch } from '@/lib/api-client'

export type ApiDailyRevenueItem = {
  booking_id: string
  booking_number: string
  customer_name: string
  menu_name: string | null
  booking_date: string
  start_time: string
  price: number
  payment_method: string
  payment_status: string
  paid_amount: number | null
  paid_at: string | null
  refunded_at: string | null
  app_order_id: string | null
  app_order_status: string | null
  grossAmount?: number
  refundAmount?: number
  netAmount?: number
}

export type ApiDailyRevenue = {
  date: string
  total_booking_amount: number
  paid_amount: number
  unpaid_amount: number
  refunded_amount: number
  app_pending_amount: number
  app_pending_count: number
  by_method: { onsite: number; app: number }
  items: ApiDailyRevenueItem[]
}

export type ApiSalesSummary = {
  dateFrom: string
  dateTo: string
  grossSales: number
  refundAmount: number
  netSales: number
  reservationCount: number
  completedCount: number
  averageOrderValue: number
  newCustomerSales: number
  returningCustomerSales: number
  comparedPreviousPeriod: number
  comparedPreviousPeriodRate: number
  today_sales?: number
  weekly_sales?: number
  monthly_sales?: number
  average_ticket?: number
  completed_count?: number
  noshow_count?: number
  maintenance_fee?: number
}

export type ApiSalesTimeseriesPoint = {
  label: string
  date: string
  grossSales: number
  refundAmount: number
  netSales: number
  reservationCount: number
  amount?: number
}

export type ApiSalesByMenu = {
  menuName?: string
  menu_name?: string
  amount: number
  pct: number
  count?: number
}

export type ApiSalesTransaction = {
  reservationId: string
  customerId: string | null
  customerName: string | null
  vehicle: string | null
  serviceName: string | null
  bookedAt: string | null
  completedAt: string | null
  paymentStatus: string
  reservationStatus: string
  grossAmount: number
  refundAmount: number
  netAmount: number
  paymentMethod: string
  booking_id?: string
  booking_number?: string
  customer_name?: string
  menu_name?: string
  booking_date?: string
  start_time?: string
  price?: number
}

function qs(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function fetchDailyRevenue(date: string) {
  return apiFetch<ApiDailyRevenue>(`/business/revenue/daily${qs({ date })}`)
}

export async function fetchSalesSummary(dateFrom?: string, dateTo?: string) {
  return apiFetch<ApiSalesSummary>(
    `/business/sales/summary${qs({ dateFrom, dateTo })}`,
  )
}

export async function fetchRevenueSummary() {
  return apiFetch<ApiSalesSummary>('/business/revenue/summary')
}

export async function fetchSalesTimeseries(
  dateFrom: string,
  dateTo: string,
  interval: 'day' | 'week' | 'month' = 'day',
) {
  return apiFetch<{ interval: string; items: ApiSalesTimeseriesPoint[] }>(
    `/business/sales/timeseries${qs({ dateFrom, dateTo, interval })}`,
  )
}

export async function fetchSalesByMenu(dateFrom?: string, dateTo?: string) {
  return apiFetch<ApiSalesByMenu[]>(
    `/business/sales/by-menu${qs({ dateFrom, dateTo })}`,
  )
}

export async function fetchRevenueByMenu(period: 'today' | 'week' | 'month' = 'today') {
  return apiFetch<ApiSalesByMenu[]>(`/business/revenue/by-menu${qs({ period })}`)
}

export async function fetchSalesTransactions(params: {
  dateFrom?: string
  dateTo?: string
  q?: string
  status?: string
  paymentMethod?: string
  page?: number
  pageSize?: number
}) {
  return apiFetch<{
    items: ApiSalesTransaction[]
    total: number
    page: number
    pageSize: number
  }>(`/business/sales/transactions${qs(params)}`)
}
