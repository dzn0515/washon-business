import { getAccessToken } from '@/lib/api-client'
import { getToken } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function getSalesToken(): string {
  return getAccessToken() ?? getToken() ?? ''
}

async function salesFetchDetail<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getSalesToken()}`,
    ...(options?.headers as Record<string, string> | undefined),
  }
  if (options?.body != null && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    let detail = `API error: ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
      else if (Array.isArray(body.detail)) {
        detail = body.detail
          .map((d: { msg?: string }) => d?.msg)
          .filter(Boolean)
          .join(', ')
      }
    } catch {
      /* ignore */
    }
    const err = new Error(detail) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export type SalesMe = {
  id: string
  name: string
  code: string
  email: string | null
  phone: string | null
  employmentType: string
  status: string
  distributorName: string | null
  agencyName: string | null
  joinedAt: string | null
}

export type SalesRecentActivity = {
  type: string
  partnerId: string
  partnerName: string
  status: string | null
  at: string
}

export type SalesDashboard = {
  todayConsultations: number
  onboardedCount: number
  inProgressCount: number
  myPartnersCount: number
  estimatedMonthCommission: number
  newPartnersThisMonth: number
  recentActivities: SalesRecentActivity[]
}

export type SalesPartnerListItem = {
  partnerId: string
  partnerName: string
  ownerName: string | null
  phone: string | null
  email: string | null
  address: string | null
  bizType: string | null
  status: string
  planTier: string
  isFreeTrial: boolean
  estimatedCommission: number
  assignedAt: string
}

export type SalesPartnerListResponse = {
  items: SalesPartnerListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SalesPartnerDetail = SalesPartnerListItem & {
  memo: string | null
  businessRegistrationNo: string | null
  latitude: number | null
  longitude: number | null
}

export type SalesApplyRequest = {
  businessName: string
  ownerName: string
  email: string
  phone: string
  password?: string | null
  address?: string
  bizType?: string
  memo?: string | null
}

export type SalesApplyResponse = {
  partnerId: string
  status: string
  message: string
}

export type SalesPerformancePeriod = 'month' | 'quarter' | 'year'

export type SalesPerformance = {
  period: string
  newPartners: number
  activePartners: number
  freeTrialPartners: number
  paidPartners: number
  estimatedCommission: number
}

export type SalesCommissionItem = {
  partnerId: string
  partnerName: string
  planTier: string
  estimated: boolean
  agentCommission: number
  totalCommission: number
  commissionMonth: number
  remainingMonths: number
  note: string | null
}

export type SalesCommission = {
  estimated: boolean
  monthTotal: number
  items: SalesCommissionItem[]
}

/** GET /sales/me */
export async function fetchSalesMe(): Promise<SalesMe> {
  return salesFetchDetail('/sales/me')
}

/** GET /sales/dashboard */
export async function fetchSalesDashboard(): Promise<SalesDashboard> {
  return salesFetchDetail('/sales/dashboard')
}

/** GET /sales/partners */
export async function fetchSalesPartners(params?: {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<SalesPartnerListResponse> {
  return salesFetchDetail(
    `/sales/partners${qs({
      keyword: params?.keyword,
      status: params?.status && params.status !== 'all' ? params.status : undefined,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /sales/partners/{id} */
export async function fetchSalesPartnerDetail(id: string): Promise<SalesPartnerDetail> {
  return salesFetchDetail(`/sales/partners/${id}`)
}

/** POST /sales/apply */
export async function submitSalesApply(body: SalesApplyRequest): Promise<SalesApplyResponse> {
  return salesFetchDetail('/sales/apply', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** GET /sales/performance */
export async function fetchSalesPerformance(
  period: SalesPerformancePeriod = 'month',
): Promise<SalesPerformance> {
  return salesFetchDetail(`/sales/performance${qs({ period })}`)
}

/** GET /sales/commission */
export async function fetchSalesCommission(): Promise<SalesCommission> {
  return salesFetchDetail('/sales/commission')
}
