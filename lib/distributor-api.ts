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

export type DistributorMe = {
  id: string
  name: string
  code: string
  representativeName: string | null
  email: string | null
  phone: string | null
  region: string | null
  status: string
  accountEmail: string | null
  agentShare?: number | string | null
  agencyShare?: number | string | null
  distributorShare?: number | string | null
  staffRole?: string | null
  staffRoleLabel?: string | null
  isOwner?: boolean
  passwordResetRequired?: boolean
}

export type DistributorRecentItem = {
  id: string
  name: string
  status?: string | null
  at?: string | null
}

export type DistributorDashboard = {
  agencyCount: number
  agentCount: number
  assignedPartnerCount: number
  activePartnerCount: number
  freeTrialPartnerCount: number
  convertedLeadCount: number
  reviewingLeadCount: number
  estimatedMonthlyCommission: number
  thisMonthNewPartners: number
  agentShare?: number | string | null
  agencyShare?: number | string | null
  distributorShare?: number | string | null
  recentAgencies: DistributorRecentItem[]
  recentAgents: DistributorRecentItem[]
  recentPartners: DistributorRecentItem[]
  recentLeads: DistributorRecentItem[]
}

export type DistributorListResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type DistributorAgencyListItem = {
  id: string
  name: string
  code: string
  representativeName: string | null
  phone: string | null
  email: string | null
  region: string | null
  status: string
  agentCount: number
  partnerCount: number
  estimatedMonthlyCommission: number
}

export type DistributorAgencyDetail = DistributorAgencyListItem & {
  memo: string | null
  agents: DistributorAgentListItem[]
  partners: DistributorPartnerListItem[]
}

export type DistributorAgentListItem = {
  id: string
  name: string
  code: string
  phone: string | null
  email: string | null
  status: string
  employmentType: string
  agencyId: string | null
  agencyName: string | null
  partnerCount: number
  estimatedMonthlyCommission: number
  joinedAt: string | null
}

export type DistributorAgentDetail = DistributorAgentListItem & {
  memo: string | null
  partners: DistributorPartnerListItem[]
}

export type DistributorPartnerListItem = {
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
  agencyId: string | null
  agencyName: string | null
  agentId: string | null
  agentName: string | null
}

export type DistributorPartnerDetail = DistributorPartnerListItem & {
  memo: string | null
  businessRegistrationNo: string | null
}

export type DistributorLead = {
  id: string
  salesAgentId: string
  salesAgentName: string | null
  agencyId: string | null
  agencyName: string | null
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

export type DistributorPerformancePeriod = 'month' | 'quarter' | 'year'

export type DistributorBreakdownItem = {
  id: string
  name: string
  count: number
  estimatedCommission: number
}

export type DistributorPerformance = {
  period: string
  newLeads: number
  convertedLeads: number
  rejectedLeads: number
  newPartners: number
  activePartners: number
  freeTrialPartners: number
  paidPartners: number
  conversionRate: number
  agencyBreakdown: DistributorBreakdownItem[]
  agentBreakdown: DistributorBreakdownItem[]
}

export type DistributorCommissionPartnerItem = {
  partnerId: string
  partnerName: string
  planTier: string
  estimated: boolean
  distributorCommission: number
  remainingMonths: number
  agencyName: string | null
  agentName: string | null
  note: string | null
}

export type DistributorCommission = {
  estimated: boolean
  thisMonth: number
  nextMonthEstimate: number
  yearlyEstimate: number
  distributorRate: number | string
  partnerBreakdown: DistributorCommissionPartnerItem[]
  agencyBreakdown: DistributorBreakdownItem[]
}

/** GET /distributor/me */
export async function fetchDistributorMe(): Promise<DistributorMe> {
  return apiFetch('/distributor/me')
}

/** GET /distributor/dashboard */
export async function fetchDistributorDashboard(): Promise<DistributorDashboard> {
  return apiFetch('/distributor/dashboard')
}

/** GET /distributor/agencies */
export async function fetchDistributorAgencies(params?: {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<DistributorListResponse<DistributorAgencyListItem>> {
  return apiFetch(
    `/distributor/agencies${qs({
      keyword: params?.keyword,
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /distributor/agencies/{id} */
export async function fetchDistributorAgencyDetail(
  id: string,
): Promise<DistributorAgencyDetail> {
  return apiFetch(`/distributor/agencies/${id}`)
}

/** GET /distributor/agents */
export async function fetchDistributorAgents(params?: {
  keyword?: string
  status?: string
  agencyId?: string
  employmentType?: string
  page?: number
  pageSize?: number
}): Promise<DistributorListResponse<DistributorAgentListItem>> {
  return apiFetch(
    `/distributor/agents${qs({
      keyword: params?.keyword,
      status: params?.status,
      agencyId: params?.agencyId,
      employmentType: params?.employmentType,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /distributor/agents/{id} */
export async function fetchDistributorAgentDetail(
  id: string,
): Promise<DistributorAgentDetail> {
  return apiFetch(`/distributor/agents/${id}`)
}

/** GET /distributor/partners */
export async function fetchDistributorPartners(params?: {
  keyword?: string
  agencyId?: string
  agentId?: string
  partnerStatus?: string
  planTier?: string
  bizType?: string
  page?: number
  pageSize?: number
}): Promise<DistributorListResponse<DistributorPartnerListItem>> {
  return apiFetch(
    `/distributor/partners${qs({
      keyword: params?.keyword,
      agencyId: params?.agencyId,
      agentId: params?.agentId,
      partnerStatus: params?.partnerStatus,
      planTier: params?.planTier,
      bizType: params?.bizType,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /distributor/partners/{id} */
export async function fetchDistributorPartnerDetail(
  id: string,
): Promise<DistributorPartnerDetail> {
  return apiFetch(`/distributor/partners/${id}`)
}

/** GET /distributor/leads */
export async function fetchDistributorLeads(params?: {
  status?: string
  agencyId?: string
  agentId?: string
  businessType?: string
  page?: number
  pageSize?: number
}): Promise<DistributorListResponse<DistributorLead>> {
  return apiFetch(
    `/distributor/leads${qs({
      status: params?.status,
      agencyId: params?.agencyId,
      agentId: params?.agentId,
      businessType: params?.businessType,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /distributor/performance */
export async function fetchDistributorPerformance(
  period: DistributorPerformancePeriod = 'month',
): Promise<DistributorPerformance> {
  return apiFetch(`/distributor/performance${qs({ period })}`)
}

/** GET /distributor/commission */
export async function fetchDistributorCommission(): Promise<DistributorCommission> {
  return apiFetch('/distributor/commission')
}

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------

export type DistributorSettlementListItem = {
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

export type DistributorSettlementLine = {
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

export type DistributorSettlementListResponse = {
  items: DistributorSettlementListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  estimated: boolean
}

export type DistributorSettlementDetail = DistributorSettlementListItem & {
  lines: DistributorSettlementLine[]
}

/** GET /distributor/settlements */
export async function fetchDistributorSettlements(params?: {
  page?: number
  pageSize?: number
}): Promise<DistributorSettlementListResponse> {
  return apiFetch(
    `/distributor/settlements${qs({
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** GET /distributor/settlements/{id} */
export async function fetchDistributorSettlement(
  id: string,
): Promise<DistributorSettlementDetail> {
  return apiFetch(`/distributor/settlements/${id}`)
}

// ---------------------------------------------------------------------------
// Distributor Portal RBAC (separate from Admin RBAC)
// ---------------------------------------------------------------------------

export type DistributorMenuPermissionRow = {
  menuKey: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canDownload: boolean
}

export type DistributorMyPermissions = {
  staffRole: string
  staffRoleLabel: string
  isOwner: boolean
  distributorId: string
  passwordResetRequired: boolean
  permissions: DistributorMenuPermissionRow[]
}

/** GET /distributor/me/permissions */
export async function fetchDistributorMyPermissions(): Promise<DistributorMyPermissions> {
  return apiFetch('/distributor/me/permissions')
}

/** Formats a caught API error into a user-facing message, special-casing 403 permission errors. */
export function formatDistributorPermissionError(
  err: unknown,
  fallback = '요청 처리에 실패했습니다.',
): string {
  const status = (err as (Error & { status?: number }) | undefined)?.status
  if (status === 403) return '이 작업을 수행할 권한이 없습니다.'
  if (err instanceof Error && err.message) return err.message
  return fallback
}

// ---------------------------------------------------------------------------
// Distributor staff management (OWNER only for mutations)
// ---------------------------------------------------------------------------

/** Assignable staff roles (OWNER is granted automatically, cannot be created). */
export const DISTRIBUTOR_STAFF_ROLES = [
  { key: 'OPERATIONS', label: '운영' },
  { key: 'SALES', label: '영업' },
  { key: 'FINANCE', label: '정산' },
  { key: 'VIEWER', label: '조회' },
] as const

export const DISTRIBUTOR_STAFF_ROLE_LABELS: Record<string, string> = {
  OWNER: '총판 대표',
  OPERATIONS: '운영관리자',
  SALES: '영업',
  FINANCE: '정산',
  VIEWER: '조회',
}

export type DistributorRolePermissions = {
  role: string
  roleLabel: string
  isFixed: boolean
  permissions: DistributorMenuPermissionRow[]
}

/** GET /distributor/permissions/roles */
export async function fetchDistributorRolePermissions(): Promise<DistributorRolePermissions[]> {
  return apiFetch('/distributor/permissions/roles')
}

/** PUT /distributor/permissions/roles/{role} */
export async function saveDistributorRolePermissions(body: {
  role: string
  permissions: DistributorMenuPermissionRow[]
}): Promise<{ role: string; permissions: DistributorMenuPermissionRow[] }> {
  return apiFetch(`/distributor/permissions/roles/${encodeURIComponent(body.role)}`, {
    method: 'PUT',
    body: JSON.stringify({ permissions: body.permissions }),
  })
}

export type DistributorStaffItem = {
  id: string
  userId: string
  name: string
  email: string | null
  staffRole: string
  staffRoleLabel: string
  isOwner: boolean
  status: string
  isActive: boolean
  passwordResetRequired: boolean
  lastLoginAt: string | null
  createdAt: string | null
  temporaryPassword?: string
  loginUrl?: string
}

/** GET /distributor/staff */
export async function listDistributorStaff(params?: {
  q?: string
  role?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<DistributorListResponse<DistributorStaffItem>> {
  return apiFetch(
    `/distributor/staff${qs({
      q: params?.q,
      role: params?.role,
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** POST /distributor/staff */
export async function createDistributorStaff(body: {
  name: string
  email: string
  staffRole: string
  temporaryPassword?: string
  isActive?: boolean
}): Promise<DistributorStaffItem> {
  return apiFetch('/distributor/staff', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** PATCH /distributor/staff/{id} */
export async function updateDistributorStaff(
  id: string,
  body: { name?: string; staffRole?: string },
): Promise<DistributorStaffItem> {
  return apiFetch(`/distributor/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** POST /distributor/staff/{id}/activate */
export async function activateDistributorStaff(id: string): Promise<DistributorStaffItem> {
  return apiFetch(`/distributor/staff/${id}/activate`, { method: 'POST' })
}

/** POST /distributor/staff/{id}/deactivate */
export async function deactivateDistributorStaff(id: string): Promise<DistributorStaffItem> {
  return apiFetch(`/distributor/staff/${id}/deactivate`, { method: 'POST' })
}

/** POST /distributor/staff/{id}/reset-password */
export async function resetDistributorStaffPassword(
  id: string,
  temporaryPassword?: string,
): Promise<DistributorStaffItem> {
  return apiFetch(`/distributor/staff/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(temporaryPassword ? { temporaryPassword } : {}),
  })
}
