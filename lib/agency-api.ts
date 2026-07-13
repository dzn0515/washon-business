import { apiFetch } from '@/lib/api-client'

function qs(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export type AgencyMe = {
  id: string
  name: string
  code: string
  distributorId: string
  distributorName: string | null
  representativeName: string | null
  email: string | null
  phone: string | null
  region: string | null
  status: string
  accountEmail: string | null
}

export type AgencyRecentItem = {
  id: string
  name: string
  status?: string | null
  at?: string | null
}

export type AgencyDashboard = {
  agentCount: number
  assignedPartnerCount: number
  activePartnerCount: number
  freeTrialPartnerCount: number
  convertedLeadCount: number
  reviewingLeadCount: number
  estimatedMonthlyCommission: number
  thisMonthNewPartners: number
  recentAgents: AgencyRecentItem[]
  recentPartners: AgencyRecentItem[]
  recentLeads: AgencyRecentItem[]
}

export type AgencyListResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type AgencyAgentListItem = {
  id: string
  name: string
  code: string
  phone: string | null
  email: string | null
  status: string
  employmentType: string
  partnerCount: number
  estimatedMonthlyCommission: number
  joinedAt: string | null
}

export type AgencyAgentDetail = AgencyAgentListItem & {
  memo: string | null
  partners: AgencyPartnerListItem[]
}

export type AgencyPartnerListItem = {
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
  agentId: string | null
  agentName: string | null
}

export type AgencyPartnerDetail = AgencyPartnerListItem & {
  memo: string | null
  businessRegistrationNo: string | null
}

export type AgencyLead = {
  id: string
  salesAgentId: string
  salesAgentName: string | null
  companyName: string
  ownerName: string
  phone: string
  email: string
  businessType: string
  address: string | null
  memo: string | null
  status: string
  partnerId: string | null
  partnerCreated: boolean
  rejectionReason: string | null
  createdAt: string
  updatedAt: string | null
}

export type AgencyPerformancePeriod = 'month' | 'quarter' | 'year'

export type AgencyBreakdownItem = {
  id: string
  name: string
  count: number
  estimatedCommission: number
}

export type AgencyPerformance = {
  period: string
  newLeads: number
  convertedLeads: number
  rejectedLeads: number
  newPartners: number
  activePartners: number
  freeTrialPartners: number
  paidPartners: number
  conversionRate: number
  agentBreakdown: AgencyBreakdownItem[]
}

export type AgencyCommissionPartnerItem = {
  partnerId: string
  partnerName: string
  planTier: string
  estimated: boolean
  agencyCommission: number
  remainingMonths: number
  agentName: string | null
  note: string | null
}

export type AgencyCommission = {
  estimated: boolean
  thisMonth: number
  nextMonthEstimate: number
  yearlyEstimate: number
  agencyRate: number | string
  partnerBreakdown: AgencyCommissionPartnerItem[]
  agentBreakdown: AgencyBreakdownItem[]
}

/** GET /agency/me */
export async function fetchAgencyMe(): Promise<AgencyMe> {
  return apiFetch('/agency/me')
}

/** GET /agency/dashboard */
export async function fetchAgencyDashboard(): Promise<AgencyDashboard> {
  return apiFetch('/agency/dashboard')
}

/** GET /agency/agents */
export async function fetchAgencyAgents(params?: {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<AgencyListResponse<AgencyAgentListItem>> {
  return apiFetch(
    `/agency/agents${qs({
      keyword: params?.keyword,
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /agency/agents/{id} */
export async function fetchAgencyAgentDetail(id: string): Promise<AgencyAgentDetail> {
  return apiFetch(`/agency/agents/${id}`)
}

/** GET /agency/partners */
export async function fetchAgencyPartners(params?: {
  keyword?: string
  agentId?: string
  partnerStatus?: string
  planTier?: string
  bizType?: string
  page?: number
  pageSize?: number
}): Promise<AgencyListResponse<AgencyPartnerListItem>> {
  return apiFetch(
    `/agency/partners${qs({
      keyword: params?.keyword,
      agentId: params?.agentId,
      partnerStatus: params?.partnerStatus,
      planTier: params?.planTier,
      bizType: params?.bizType,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /agency/partners/{id} */
export async function fetchAgencyPartnerDetail(id: string): Promise<AgencyPartnerDetail> {
  return apiFetch(`/agency/partners/${id}`)
}

/** GET /agency/leads */
export async function fetchAgencyLeads(params?: {
  status?: string
  agentId?: string
  businessType?: string
  page?: number
  pageSize?: number
}): Promise<AgencyListResponse<AgencyLead>> {
  return apiFetch(
    `/agency/leads${qs({
      status: params?.status,
      agentId: params?.agentId,
      businessType: params?.businessType,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /agency/performance */
export async function fetchAgencyPerformance(
  period: AgencyPerformancePeriod = 'month',
): Promise<AgencyPerformance> {
  return apiFetch(`/agency/performance${qs({ period })}`)
}

/** GET /agency/commission */
export async function fetchAgencyCommission(): Promise<AgencyCommission> {
  return apiFetch('/agency/commission')
}

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------

export type AgencySettlementListItem = {
  id: string
  settlementMonth: string
  status: string
  recipientType: string
  eligiblePartnerCount: number
  netSalesBasis: number
  commissionRate: number
  commissionAmount: number
  paidAt: string | null
  estimated: boolean
}

export type AgencySettlementLine = {
  id: string
  partnerId: string
  partnerName: string
  planTier: string
  paymentNetAmount: number
  commissionRate: number
  commissionAmount: number
  eligibleMonthIndex: number
  status: string
  holdReason: string | null
  sourcePaidAt: string
  estimated: boolean
}

export type AgencySettlementListResponse = {
  items: AgencySettlementListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  estimated: boolean
}

export type AgencySettlementDetail = AgencySettlementListItem & {
  lines: AgencySettlementLine[]
}

/** GET /agency/settlements */
export async function fetchAgencySettlements(params?: {
  page?: number
  pageSize?: number
}): Promise<AgencySettlementListResponse> {
  return apiFetch(
    `/agency/settlements${qs({
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /agency/settlements/{id} */
export async function fetchAgencySettlement(id: string): Promise<AgencySettlementDetail> {
  return apiFetch(`/agency/settlements/${id}`)
}
