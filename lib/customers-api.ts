import { apiFetch } from '@/lib/api-client'

export type ApiCustomer = {
  id: string
  customerId?: string
  name: string | null
  phone: string | null
  email?: string | null
  vehicle_model: string | null
  primaryVehicle?: string | null
  visit_count: number
  visitCount?: number
  completedCount?: number
  total_spent: number
  totalSpent?: number
  last_visit_at: string | null
  lastVisitAt?: string | null
  nextReservationAt?: string | null
  couponCount?: number
  marketingConsent?: boolean
  memo: string | null
  created_at: string | null
  updated_at: string | null
}

export type ApiVisitHistory = {
  booking_id: string
  booking_number: string
  booking_date: string
  start_time: string
  menu_name: string | null
  vehicle_model: string | null
  status: string
  price: number
}

export type ApiCustomerDetail = ApiCustomer & {
  visit_history: ApiVisitHistory[]
  visitHistory?: ApiVisitHistory[]
  vehicles?: Array<{
    id: string
    licensePlate: string
    model: string | null
    brand: string | null
    isPrimary: boolean
  }>
  upcomingReservations?: ApiVisitHistory[]
  coupons?: Array<{
    id: string
    name: string
    status: string
    discountType: string
    discountValue: number
  }>
  reviews?: Array<{
    id: string
    rating: number
    content: string | null
    status: string
    createdAt: string | null
  }>
}

export type ApiCustomerListResponse = {
  items: ApiCustomer[]
  total: number
  page: number
  pageSize: number
}

export type ApiCustomerSummary = {
  totalCustomers: number
  newCustomersThisMonth: number
  returningCustomers: number
  dormantCustomers: number
  averageSpend: number
  repeatRate: number
  total: number
  new: number
  regular: number
  regular_pct: number
  vip: number
}

function normalizeCustomer(c: ApiCustomer): ApiCustomer {
  const id = c.id ?? c.customerId ?? ''
  return {
    ...c,
    id,
    name: c.name ?? null,
    phone: c.phone ?? null,
    vehicle_model: c.vehicle_model ?? c.primaryVehicle ?? null,
    visit_count: c.visit_count ?? c.visitCount ?? 0,
    total_spent: c.total_spent ?? c.totalSpent ?? 0,
    last_visit_at: c.last_visit_at ?? c.lastVisitAt ?? null,
    memo: c.memo ?? null,
    created_at: c.created_at ?? null,
    updated_at: c.updated_at ?? null,
  }
}

export async function fetchCustomerSummary() {
  return apiFetch<ApiCustomerSummary>('/business/customers/summary')
}

export async function fetchCustomers(params?: {
  q?: string
  page?: number
  pageSize?: number
  sort?: string
}) {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.sort) qs.set('sort', params.sort)
  const query = qs.toString()
  const res = await apiFetch<ApiCustomerListResponse | ApiCustomer[]>(
    `/business/customers${query ? `?${query}` : ''}`,
  )
  if (Array.isArray(res)) {
    return { items: res.map(normalizeCustomer), total: res.length, page: 1, pageSize: res.length }
  }
  return {
    ...res,
    items: (res.items ?? []).map(normalizeCustomer),
  }
}

export async function fetchCustomer(id: string) {
  const res = await apiFetch<ApiCustomerDetail>(`/business/customers/${id}`)
  const base = normalizeCustomer(res)
  const mapVisit = (v: ApiVisitHistory & { bookingId?: string; bookingNumber?: string; bookingDate?: string; startTime?: string; menuName?: string; vehicleModel?: string }) => ({
    booking_id: v.booking_id ?? v.bookingId ?? '',
    booking_number: v.booking_number ?? v.bookingNumber ?? '',
    booking_date: v.booking_date ?? v.bookingDate ?? '',
    start_time: v.start_time ?? v.startTime ?? '',
    menu_name: v.menu_name ?? v.menuName ?? null,
    vehicle_model: v.vehicle_model ?? v.vehicleModel ?? null,
    status: (v.status ?? '').toLowerCase(),
    price: v.price ?? 0,
  })
  const history = (res.visit_history ?? res.visitHistory ?? []).map(mapVisit)
  const upcoming = (res.upcomingReservations ?? []).map(mapVisit)
  return {
    ...res,
    ...base,
    visit_history: history,
    upcomingReservations: upcoming,
  }
}
