import { apiFetch } from '@/lib/api-client'

export type ApiCustomer = {
  id: string
  name: string
  phone: string
  vehicle_model: string | null
  visit_count: number
  total_spent: number
  last_visit_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export type ApiVisitHistory = {
  booking_id: string
  booking_number: string
  booking_date: string
  start_time: string
  menu_name: string
  vehicle_model: string | null
  status: string
  price: number
}

export type ApiCustomerDetail = ApiCustomer & {
  visit_history: ApiVisitHistory[]
}

export async function fetchCustomers(q?: string) {
  const params = new URLSearchParams()
  if (q?.trim()) params.set('q', q.trim())
  const qs = params.toString()
  return apiFetch<ApiCustomer[]>(`/business/customers${qs ? `?${qs}` : ''}`)
}

export async function fetchCustomer(id: string) {
  return apiFetch<ApiCustomerDetail>(`/business/customers/${id}`)
}

export async function updateCustomer(
  id: string,
  data: { name?: string; phone?: string; memo?: string | null },
) {
  return apiFetch<ApiCustomer>(`/business/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
