import { getAccessToken } from '@/lib/api-client'
import { getToken } from '@/lib/auth'
import type {
  AdApplicationProductType,
  AdApplicationStatus,
  AdminAdApplication,
} from '@/lib/ad-applications/types'
import type { AdBillingType } from '@/lib/billing/catalog'
import type {
  PlatformSettings,
  SystemStatus,
  AdminLoginLog,
  BlockedIp,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const isDev = process.env.NODE_ENV !== 'production'

// TODO: ?? ?? ?? ? AdminBusiness, AdminReservation ? ?? ?? ??
export type AdminBusinessListItem = {
  id: string
  name: string
  bizType: string
  ownerName: string
  phone: string
  status: string
  plan: string | null
  slug: string | null
  createdAt: string
  lastLogin: string | null
  recentReservations: number
  recentRevenue: number
  rating: number | null
}

export type AdminBusinessDetail = AdminBusinessListItem & {
  email: string
  address: string
  memo: string
}

export type AdminReservationItem = {
  id: string
  businessName: string
  customerName: string
  phone?: string
  menuName: string
  bookingDate: string
  startTime: string
  status: string
  source: string | null
  price?: number
  createdAt?: string
  partnerId?: string
  vehicle: {
    licensePlate: string
    brand?: string
    model?: string
  } | null
}

export type AdminReservationDetail = AdminReservationItem & {
  bookingNumber?: string
  endTime?: string | null
  note?: string | null
  paymentMethod?: string | null
  paymentStatus?: string | null
  paidAmount?: number
  paidAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
}

export type AdminReservationListResult = {
  items: AdminReservationItem[]
  total: number
  page: number
  pageSize: number
}

function getAdminToken(): string {
  return getAccessToken() ?? getToken() ?? ''
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAdminToken()}`,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    let message = `API error: ${res.status}`
    let body: unknown
    try {
      body = await res.json()
      const detail = (body as { detail?: unknown }).detail
      if (typeof detail === 'string') message = detail
      else if (detail && typeof detail === 'object') {
        const obj = detail as { message?: string; blocking_reasons?: unknown }
        if (typeof obj.message === 'string' && obj.message) message = obj.message
      } else if (Array.isArray(detail)) {
        message = detail
          .map((d: { msg?: string }) => d?.msg)
          .filter(Boolean)
          .join(', ')
      }
    } catch {
      /* ignore */
    }
    const err = new Error(message) as Error & { status?: number; body?: unknown }
    err.status = res.status
    err.body = body
    throw err
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const MOCK_BUSINESSES: AdminBusinessListItem[] = [
  {
    id: '1',
    name: '???? ???',
    bizType: 'wash',
    ownerName: '???',
    phone: '010-1234-5678',
    status: 'active',
    plan: 'basic',
    slug: 'sparkling',
    createdAt: '2026-06-01',
    lastLogin: '2026-06-28',
    recentReservations: 8,
    recentRevenue: 240000,
    rating: 4.8,
  },
  {
    id: '2',
    name: '??? ????',
    bizType: 'detailing',
    ownerName: '???',
    phone: '010-9876-5432',
    status: 'active',
    plan: 'pro',
    slug: 'cleanka',
    createdAt: '2026-06-10',
    lastLogin: '2026-06-27',
    recentReservations: 5,
    recentRevenue: 180000,
    rating: 4.6,
  },
  {
    id: '3',
    name: '????',
    bizType: 'tire',
    ownerName: '???',
    phone: '010-5555-1234',
    status: 'pending',
    plan: null,
    slug: null,
    createdAt: '2026-06-25',
    lastLogin: null,
    recentReservations: 0,
    recentRevenue: 0,
    rating: null,
  },
]

const MOCK_RESERVATIONS: AdminReservationItem[] = [
  {
    id: 'r1',
    businessName: '???? ???',
    customerName: '???',
    menuName: '????',
    bookingDate: '2026-06-28',
    startTime: '10:00',
    status: 'confirmed',
    source: 'app',
    vehicle: { licensePlate: '12?3456', brand: 'BMW', model: '520d' },
  },
  {
    id: 'r2',
    businessName: '???',
    customerName: '???',
    menuName: '?????',
    bookingDate: '2026-06-28',
    startTime: '11:30',
    status: 'in_progress',
    source: 'qr',
    vehicle: null,
  },
  {
    id: 'r3',
    businessName: '????',
    customerName: '???',
    menuName: '??',
    bookingDate: '2026-06-28',
    startTime: '14:00',
    status: 'pending',
    source: 'app',
    vehicle: { licensePlate: '34?5678', brand: '??', model: '???' },
  },
]

// ?? ?? (Admin-02) ??????????????????????????????????????????

export async function fetchAdminStats() {
  try {
    return await adminFetch<Record<string, number>>('/admin/stats')
  } catch {
    if (!isDev) throw new Error('?? ?? ??')
    return {
      totalBusinesses: 3,
      activeBusinesses: 2,
      todayReservations: 8,
      ongoingReservations: 3,
      todayRevenue: 240000,
      monthRevenue: 1840000,
      newBusinesses: 1,
      pendingBusinesses: 1,
    }
  }
}

export async function fetchRecentReservations() {
  try {
    const data = await adminFetch<unknown>('/admin/reservations?limit=5')
    const list = Array.isArray(data)
      ? data
      : (data as { reservations?: unknown[] }).reservations ??
        (data as { items?: unknown[] }).items ??
        []
    return list as Record<string, string>[]
  } catch {
    if (!isDev) throw new Error('?? ?? ?? ??')
    return MOCK_RESERVATIONS.map((r) => ({
      id: r.id,
      businessName: r.businessName,
      customerName: r.customerName,
      menu: r.menuName,
      date: r.bookingDate,
      time: r.startTime,
      status: r.status,
    }))
  }
}

export async function fetchRecentBusinesses() {
  try {
    const partners = await fetchAdminPartners()
    return partners
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
  } catch {
    if (!isDev) throw new Error('?? ?? ?? ??')
    return MOCK_BUSINESSES.slice(0, 3)
  }
}

export type AdminDashboardStats = {
  totalBusinesses: number
  activeBusinesses: number
  pendingBusinesses: number
  todayReservations: number
  ongoingReservations: number
  todayRevenue: number
  monthRevenue: number
  newBusinesses: number
}

export type AdminDashboardRecentReservation = {
  id: string
  businessName: string
  customerName: string
  menu: string
  status: string
}

export type AdminDashboardRecentPartner = {
  id: string
  name: string
  bizType: string
  status: string
  createdAt: string
}

export type AdminDashboardResponse = {
  stats: AdminDashboardStats
  recentReservations: AdminDashboardRecentReservation[]
  recentPartners: AdminDashboardRecentPartner[]
}

/** GET /api/v1/admin/dashboard ? ??? ???? ?? */
export async function fetchAdminDashboard(): Promise<AdminDashboardResponse> {
  return adminFetch<AdminDashboardResponse>('/admin/dashboard')
}

// ?? Admin Partners (???? / ?? ??) ?????????????????????

export type AdminPartnerApiStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE'

export type AdminPartnerItem = {
  id: string
  business_name: string
  owner_name: string | null
  email: string | null
  phone: string | null
  business_registration_no: string | null
  address: string | null
  has_coordinates?: boolean
  biz_type: string
  bay_count: number
  status: string
  slug: string
  created_at: string
  region_code?: string | null
  plan_tier?: string | null
  subscription_status?: string | null
  payment_status?: string | null
  distributor_id?: string | null
  distributor_name?: string | null
  agency_id?: string | null
  agency_name?: string | null
  agent_id?: string | null
  agent_name?: string | null
  franchise_id?: string | null
  franchise_name?: string | null
  last_login_at?: string | null
  recent_reservations?: number
  deleted_at?: string | null
}

export type AdminPartnerSummary = {
  total: number
  pending: number
  active: number
  suspended: number
  setup_incomplete: number
  stale_login: number
  unpaid: number
  deleted: number
}

export type AdminPartnerAuditItem = {
  id: string
  action: string
  reason: string | null
  actor_type: string
  actor_id: string | null
  created_at: string
  field_changes: Record<string, unknown> | null
}

export type AdminPartnerDetail = AdminPartnerItem & {
  latitude: number | null
  longitude: number | null
  recent_audits: AdminPartnerAuditItem[]
  partner_memo_supported: boolean
  partner_memo: string | null
}

export type AdminPartnerListItem = AdminBusinessListItem & {
  email: string
  businessRegistrationNo: string
  address: string
  hasCoordinates: boolean
  bayCount: number
  regionCode: string | null
  planTier: string | null
  distributorName: string | null
  agencyName: string | null
  agentName: string | null
  franchiseName: string | null
  deletedAt: string | null
}

function toPartnerStatusQuery(status?: string): AdminPartnerApiStatus | undefined {
  if (!status || status === 'all') return undefined
  const map: Record<string, AdminPartnerApiStatus> = {
    pending: 'PENDING',
    active: 'ACTIVE',
    rejected: 'REJECTED',
    suspended: 'SUSPENDED',
    inactive: 'INACTIVE',
  }
  return map[status.toLowerCase()]
}

function mapPartnerItem(p: AdminPartnerItem): AdminPartnerListItem {
  return {
    id: p.id,
    name: p.business_name,
    bizType: p.biz_type,
    ownerName: p.owner_name ?? '',
    phone: p.phone ?? '',
    status: p.status.toLowerCase(),
    plan: p.plan_tier ?? null,
    slug: p.slug,
    createdAt: p.created_at.slice(0, 10),
    lastLogin: p.last_login_at ? p.last_login_at.slice(0, 10) : null,
    recentReservations: p.recent_reservations ?? 0,
    recentRevenue: 0,
    rating: null,
    email: p.email ?? '',
    businessRegistrationNo: p.business_registration_no ?? '',
    address: p.address ?? '',
    hasCoordinates: Boolean(p.has_coordinates),
    bayCount: p.bay_count,
    regionCode: p.region_code ?? null,
    planTier: p.plan_tier ?? null,
    distributorName: p.distributor_name ?? null,
    agencyName: p.agency_name ?? null,
    agentName: p.agent_name ?? null,
    franchiseName: p.franchise_name ?? null,
    deletedAt: p.deleted_at ?? null,
  }
}

/** GET /api/v1/admin/partners ? status/keyword/bizType/page ?? */
export type AdminPartnerListResponse = {
  partners: AdminPartnerItem[]
  items: AdminPartnerItem[]
  total: number
  page: number
  pageSize: number
  total_pages?: number
  summary?: AdminPartnerSummary | null
}

export async function fetchAdminPartners(
  status?: AdminPartnerApiStatus,
): Promise<AdminPartnerListItem[]> {
  const qs = status ? `?status=${status}` : ''
  const data = await adminFetch<AdminPartnerListResponse>(`/admin/partners${qs}`)
  const rows = data.items?.length ? data.items : data.partners
  return rows.map(mapPartnerItem)
}

/** PUT /api/v1/admin/partners/{id}/approve ? PENDING ? ACTIVE */
export async function approveAdminPartner(id: string): Promise<{ success: boolean }> {
  await adminFetch(`/admin/partners/${id}/approve`, { method: 'PUT' })
  return { success: true }
}

/** PUT /api/v1/admin/partners/{id}/reject ? PENDING ? REJECTED */
export async function rejectAdminPartner(
  id: string,
  reason: string,
): Promise<{ success: boolean }> {
  await adminFetch(`/admin/partners/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  })
  return { success: true }
}

/** PUT /api/v1/admin/partners/{id}/suspend ? ACTIVE ? SUSPENDED */
export async function suspendAdminPartner(id: string): Promise<{ success: boolean }> {
  await adminFetch(`/admin/partners/${id}/suspend`, { method: 'PUT' })
  return { success: true }
}

/** PUT /api/v1/admin/partners/{id}/restore ? SUSPENDED ? ACTIVE */
export async function restoreAdminPartner(id: string): Promise<{ success: boolean }> {
  await adminFetch(`/admin/partners/${id}/restore`, { method: 'PUT' })
  return { success: true }
}

// ?? Admin-03 ?????????????????????????????????????????????????

export type AdminBusinessListResult = {
  items: AdminPartnerListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: AdminPartnerSummary | null
}

export type FetchAdminBusinessesParams = {
  status?: string
  search?: string
  bizType?: string
  page?: number
  pageSize?: number
  region?: string
  planTier?: string
  hasCoordinates?: boolean | null
  deleted?: 'exclude' | 'include' | 'only'
  kpi?: string
  sort?: string
  createdFrom?: string
  createdTo?: string
  includeSummary?: boolean
}

// GET /api/v1/admin/partners — ops center list
export async function fetchAdminAllBusinesses(
  params?: FetchAdminBusinessesParams,
): Promise<AdminBusinessListResult> {
  const qs = new URLSearchParams()
  const apiStatus = toPartnerStatusQuery(params?.status)
  if (apiStatus) qs.set('status', apiStatus)
  if (params?.search?.trim()) qs.set('keyword', params.search.trim())
  if (params?.bizType && params.bizType !== 'all') qs.set('bizType', params.bizType)
  if (params?.region?.trim()) qs.set('region', params.region.trim())
  if (params?.planTier && params.planTier !== 'all') qs.set('planTier', params.planTier)
  if (params?.hasCoordinates === true) qs.set('hasCoordinates', 'true')
  if (params?.hasCoordinates === false) qs.set('hasCoordinates', 'false')
  if (params?.deleted) qs.set('deleted', params.deleted)
  if (params?.kpi && params.kpi !== 'all') qs.set('kpi', params.kpi)
  if (params?.sort) qs.set('sort', params.sort)
  if (params?.createdFrom) qs.set('createdFrom', params.createdFrom)
  if (params?.createdTo) qs.set('createdTo', params.createdTo)
  if (params?.includeSummary) qs.set('includeSummary', 'true')
  qs.set('page', String(params?.page ?? 1))
  qs.set('pageSize', String(params?.pageSize ?? 30))
  const data = await adminFetch<AdminPartnerListResponse>(`/admin/partners?${qs}`)
  const rows = data.items?.length ? data.items : data.partners
  return {
    items: rows.map(mapPartnerItem),
    total: data.total ?? rows.length,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? rows.length,
    totalPages: data.total_pages ?? Math.max(1, Math.ceil((data.total ?? rows.length) / (data.pageSize || 30))),
    summary: data.summary ?? null,
  }
}

export async function fetchAdminPartnerSummary(): Promise<AdminPartnerSummary> {
  return adminFetch<AdminPartnerSummary>('/admin/partners/summary')
}

export async function fetchAdminPartnerDetail(id: string): Promise<AdminPartnerDetail> {
  return adminFetch<AdminPartnerDetail>(`/admin/partners/${id}`)
}

export type AdminPartnerDeletionBlockingReason = {
  code: string
  count: number
  message: string
}

export type AdminPartnerDeletionImpact = {
  partner_id: number
  can_delete: boolean
  blocking_reasons: AdminPartnerDeletionBlockingReason[]
  counts: {
    active_reservations: number
    future_reservations: number
    pending_payments: number
    unsettled_payments: number
    pending_refunds: number
    staff_accounts: number
    reviews: number
    completed_reservations: number
    sales_assignments: number
    franchise_links: number
  }
  account_effects: {
    owner_accounts_disabled: number
    staff_accounts_disabled: number
  }
}

/** GET /admin/partners/{id}/deletion-impact */
export async function fetchAdminPartnerDeletionImpact(
  id: string,
): Promise<AdminPartnerDeletionImpact> {
  return adminFetch<AdminPartnerDeletionImpact>(`/admin/partners/${id}/deletion-impact`)
}

/** POST /admin/partners/{id}/delete — soft-delete */
export async function softDeleteAdminPartner(
  id: string,
  body: { confirm_warning: boolean; confirmation_text: string; reason: string },
): Promise<void> {
  await adminFetch<void>(`/admin/partners/${id}/delete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** POST /admin/partners/{id}/undelete — restore soft-deleted partner */
export async function undeleteAdminPartner(
  id: string,
  body: { confirm_warning: boolean; reason: string },
): Promise<{ success: boolean; message: string; partner_id: string; status: string }> {
  return adminFetch(`/admin/partners/${id}/undelete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Prefer dedicated detail endpoint; keep legacy shape for [id] page
export async function fetchAdminBusinessDetail(id: string): Promise<AdminBusinessDetail> {
  try {
    const detail = await fetchAdminPartnerDetail(id)
    const mapped = mapPartnerItem(detail)
    return {
      ...mapped,
      email: detail.email ?? '',
      address: detail.address ?? '',
      memo: detail.partner_memo ?? '',
    }
  } catch {
    const partners = await fetchAdminPartners()
    const found = partners.find((p) => p.id === id)
    if (!found) throw new Error('업체를 찾을 수 없습니다.')
    return {
      ...found,
      memo: '',
    }
  }
}

// PUT /admin/partners/{id}/approve|reject|suspend|restore
export async function updateBusinessStatus(
  id: string,
  status: string,
  reason?: string,
  currentStatus?: string,
): Promise<{ success: boolean }> {
  if (status === 'suspended') {
    return suspendAdminPartner(id)
  }
  if (status === 'active' && currentStatus === 'suspended') {
    return restoreAdminPartner(id)
  }
  if (status === 'active') {
    return approveAdminPartner(id)
  }
  if (status === 'rejected') {
    return rejectAdminPartner(id, reason?.trim() || '??? ??')
  }
  throw new Error('???? ?? ?? ?????.')
}

// TODO: PATCH /api/v1/admin/businesses/{id}/memo ? ??? ???
export async function saveBusinessMemo(id: string, memo: string): Promise<{ success: boolean }> {
  try {
    await adminFetch(`/admin/businesses/${id}/memo`, {
      method: 'PATCH',
      body: JSON.stringify({ memo }),
    })
    return { success: true }
  } catch {
    if (!isDev) throw new Error('?? ?? ??')
    console.warn('[Admin][Dev] saveBusinessMemo ? mock success', { id, memo })
    return { success: true }
  }
}

// GET /api/v1/admin/reservations ? ?????????
export async function fetchAdminAllReservations(params?: {
  businessId?: string
  partnerId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  keyword?: string
  page?: number
  pageSize?: number
  limit?: number
}): Promise<AdminReservationListResult> {
  const query = new URLSearchParams()
  const partnerId = params?.partnerId ?? params?.businessId
  if (partnerId) query.set('partnerId', partnerId)
  if (params?.status && params.status !== 'all') query.set('status', params.status)
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params?.dateTo) query.set('dateTo', params.dateTo)
  const keyword = params?.keyword ?? params?.search
  if (keyword?.trim()) query.set('keyword', keyword.trim())
  query.set('page', String(params?.page ?? 1))
  query.set('pageSize', String(params?.pageSize ?? params?.limit ?? 20))

  const data = await adminFetch<AdminReservationListResult>(`/admin/reservations?${query}`)
  return {
    items: (data.items ?? []).map(mapReservationItem),
    total: data.total ?? data.items?.length ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? data.items?.length ?? 20,
  }
}

export async function fetchAdminReservationDetail(id: string): Promise<AdminReservationDetail> {
  const data = await adminFetch<Record<string, unknown>>(`/admin/reservations/${id}`)
  return mapReservationDetail(data)
}

export async function updateAdminReservationStatus(
  id: string,
  status: string,
  reason?: string,
): Promise<{ success: boolean; status: string }> {
  const data = await adminFetch<{ success: boolean; status: string }>(
    `/admin/reservations/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    },
  )
  return data
}

function mapReservationDetail(r: Record<string, unknown>): AdminReservationDetail {
  const base = mapReservationItem(r)
  return {
    ...base,
    bookingNumber: r.bookingNumber ? String(r.bookingNumber) : undefined,
    endTime: r.endTime ? String(r.endTime) : null,
    note: r.note ? String(r.note) : null,
    paymentMethod: r.paymentMethod ? String(r.paymentMethod) : null,
    paymentStatus: r.paymentStatus ? String(r.paymentStatus) : null,
    paidAmount: typeof r.paidAmount === 'number' ? r.paidAmount : undefined,
    paidAt: r.paidAt ? String(r.paidAt) : null,
    startedAt: r.startedAt ? String(r.startedAt) : null,
    completedAt: r.completedAt ? String(r.completedAt) : null,
    cancelledAt: r.cancelledAt ? String(r.cancelledAt) : null,
  }
}

function mapReservationItem(r: Record<string, unknown>): AdminReservationItem {
  const vehicle = r.vehicle as Record<string, string> | string | null | undefined
  const vehicleObj =
    typeof vehicle === 'string'
      ? vehicle
        ? { licensePlate: vehicle }
        : null
      : vehicle
        ? {
            licensePlate: String(vehicle.licensePlate ?? vehicle.license_plate ?? ''),
            brand: vehicle.brand,
            model: vehicle.model ?? vehicle.modelName,
          }
        : null
  return {
    id: String(r.id),
    businessName: String(r.businessName ?? r.business_name ?? ''),
    customerName: String(r.customerName ?? r.customer_name ?? ''),
    phone: String(r.phone ?? r.customer_phone ?? ''),
    menuName: String(r.menuName ?? r.menu_name ?? r.menu ?? ''),
    bookingDate: String(r.bookingDate ?? r.booking_date ?? r.date ?? '').slice(0, 10),
    startTime: String(
      r.startTime ?? r.bookingTime ?? r.start_time ?? r.booking_time ?? r.time ?? '',
    ).slice(0, 5),
    status: String(r.status ?? 'pending'),
    source: r.source ? String(r.source) : null,
    price: typeof r.price === 'number' ? r.price : undefined,
    createdAt: r.createdAt ? String(r.createdAt) : undefined,
    partnerId: r.partnerId ? String(r.partnerId) : undefined,
    vehicle: vehicleObj,
  }
}

export async function forceCancelReservation(
  id: string,
  reason: string,
): Promise<{ success: boolean }> {
  await updateAdminReservationStatus(id, 'cancelled', reason)
  return { success: true }
}

// ?? Admin-04 ?????????????????????????????????????????????????

// TODO: ?? ?? ?? ? AdminCSInquiry, AdminNotice ?
export type AdminCSInquiry = {
  id: string
  type: string
  title: string
  customerName?: string
  businessName?: string
  status: string
  assignee: string | null
  createdAt: string
  content?: string
  replies?: { content: string; createdAt: string; author?: string }[]
}

export type AdminNotice = {
  id: string
  title: string
  target: string
  channels: string[]
  sendType: string
  status: string
  scheduledAt?: string
  createdAt: string
}

export interface NoticePayload {
  title: string
  content: string
  target: 'all' | 'business' | 'customer'
  channels: ('push' | 'email' | 'sms')[]
  sendType: 'immediate' | 'scheduled'
  scheduledAt?: string
}

export interface RolePermissions {
  role: string
  permissions: Record<
    string,
    {
      read?: boolean
      update?: boolean
      delete?: boolean
      approve?: boolean
      download?: boolean
      view?: boolean
      edit?: boolean
    }
  >
}

export type AdminMenuPermissionRow = {
  menuKey: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canDownload: boolean
}

export type AdminRolePermissions = {
  role: string
  roleLabel: string
  isFixed: boolean
  permissions: AdminMenuPermissionRow[]
}

export type AdminMyPermissions = {
  role: string
  roleLabel: string
  distributorId: string | null
  passwordResetRequired: boolean
  permissions: AdminMenuPermissionRow[]
}

export type AdminStaffItem = {
  id: string
  name: string
  email: string | null
  role: string
  roleLabel: string
  distributorId: string | null
  distributorName: string | null
  organizationType: string
  isActive: boolean
  passwordResetRequired: boolean
  lastLoginAt: string | null
  createdAt: string
  temporaryPassword?: string
  loginUrl?: string
}

const MOCK_CS: AdminCSInquiry[] = [
  {
    id: 'cs1',
    type: 'customer',
    title: '?? ?? ?? ??',
    customerName: '???',
    status: 'pending',
    assignee: null,
    createdAt: '2026-06-28T10:00:00',
    content: '?? ??? ????? ??? ?? ???? ?????.',
    replies: [],
  },
  {
    id: 'cs2',
    type: 'business',
    title: '?? ?? ??',
    businessName: '???? ???',
    status: 'in_progress',
    assignee: '???1',
    createdAt: '2026-06-27T15:30:00',
    content: '6? ?? ??? ?? ??? ????.',
    replies: [
      { content: '?? ????.', createdAt: '2026-06-27T16:00:00', author: '???1' },
    ],
  },
  {
    id: 'cs3',
    type: 'report',
    title: '?? ?? ??',
    customerName: '???',
    status: 'completed',
    assignee: '???2',
    createdAt: '2026-06-26T09:00:00',
    content: '?? ???? ?? ??? ?? ?????.',
    replies: [
      { content: '?? ?? ?? ??????.', createdAt: '2026-06-26T11:00:00', author: '???2' },
    ],
  },
]

const MOCK_NOTICES: AdminNotice[] = [
  {
    id: 'n1',
    title: '??? ?? ??',
    target: 'all',
    channels: ['push'],
    sendType: 'immediate',
    status: 'sent',
    createdAt: '2026-06-28',
  },
  {
    id: 'n2',
    title: '?? ?? ??',
    target: 'business',
    channels: ['email'],
    sendType: 'scheduled',
    scheduledAt: '2026-06-30T09:00:00',
    status: 'scheduled',
    createdAt: '2026-06-27',
  },
]

function parseList<T>(data: unknown, keys = ['items', 'inquiries', 'notices', 'data']): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    for (const key of keys) {
      const arr = (data as Record<string, unknown>)[key]
      if (Array.isArray(arr)) return arr as T[]
    }
  }
  return []
}

// TODO: GET /api/v1/admin/cs/inquiries ? ??? ???
export async function fetchAdminCSInquiries(params?: {
  type?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<AdminCSInquiry[]> {
  try {
    const query = new URLSearchParams()
    if (params?.type && params.type !== 'all') query.set('type', params.type)
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    if (params?.search) query.set('search', params.search)
    query.set('limit', String(params?.limit ?? 20))
    if (params?.page) query.set('page', String(params.page))
    const data = await adminFetch<unknown>(`/admin/cs/inquiries?${query}`)
    return parseList<AdminCSInquiry>(data, ['inquiries', 'items'])
  } catch {
    if (!isDev) throw new Error('CS ?? ?? ??')
    console.warn('[Admin][Dev] fetchAdminCSInquiries ? mock')
    let list = [...MOCK_CS]
    if (params?.type && params.type !== 'all') list = list.filter((i) => i.type === params.type)
    if (params?.status && params.status !== 'all') list = list.filter((i) => i.status === params.status)
    if (params?.search) {
      const q = params.search.trim().toLowerCase()
      list = list.filter((i) => i.title.toLowerCase().includes(q))
    }
    return list
  }
}

// TODO: POST /api/v1/admin/cs/inquiries/{id}/reply ? ??? ???
export async function replyAdminCSInquiry(
  id: string,
  reply: string,
): Promise<{ success: boolean }> {
  try {
    await adminFetch(`/admin/cs/inquiries/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    })
    return { success: true }
  } catch {
    if (!isDev) throw new Error('?? ?? ??')
    console.warn('[Admin][Dev] replyAdminCSInquiry ? mock')
    return { success: true }
  }
}

// TODO: GET /api/v1/admin/notices ? ??? ???
export async function fetchAdminNotices(params?: {
  page?: number
  limit?: number
}): Promise<AdminNotice[]> {
  try {
    const query = new URLSearchParams()
    query.set('limit', String(params?.limit ?? 20))
    if (params?.page) query.set('page', String(params.page))
    const data = await adminFetch<unknown>(`/admin/notices?${query}`)
    return parseList<AdminNotice>(data, ['notices', 'items'])
  } catch {
    if (!isDev) throw new Error('?? ?? ?? ??')
    console.warn('[Admin][Dev] fetchAdminNotices ? mock')
    return MOCK_NOTICES
  }
}

// TODO: POST /api/v1/admin/notices ? ??? ???
export async function sendAdminNotice(data: NoticePayload): Promise<{ success: boolean; id?: string }> {
  try {
    const res = await adminFetch<{ id?: string }>('/admin/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { success: true, id: res?.id }
  } catch {
    if (!isDev) throw new Error('?? ?? ??')
    console.warn('[Admin][Dev] sendAdminNotice ? mock')
    return { success: true, id: 'mock-notice-1' }
  }
}

export async function fetchAdminRolePermissions(): Promise<AdminRolePermissions[]> {
  return adminFetchDetail('/admin/permissions/roles')
}

export async function saveRolePermissions(data: {
  role: string
  permissions: AdminMenuPermissionRow[]
}): Promise<{ success: boolean }> {
  await adminFetchDetail(`/admin/permissions/roles/${data.role}`, {
    method: 'PUT',
    body: JSON.stringify({ permissions: data.permissions }),
  })
  return { success: true }
}

export async function fetchMyAdminPermissions(): Promise<AdminMyPermissions> {
  return adminFetchDetail('/admin/me/permissions')
}

export async function changeAdminPassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<{ success: boolean }> {
  await adminFetchDetail('/admin/me/change-password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }),
  })
  return { success: true }
}

/** Formats a caught API error into a user-facing message, special-casing 403 permission errors. */
export function formatAdminPermissionError(err: unknown, fallback = '요청 처리에 실패했습니다.'): string {
  const status = (err as Error & { status?: number } | undefined)?.status
  if (status === 403) return '이 작업을 수행할 권한이 없습니다.'
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export async function fetchAdminStaff(params?: {
  q?: string
  role?: string
  status?: string
  organizationType?: string
  distributorId?: string
  page?: number
  pageSize?: number
}): Promise<{
  items: AdminStaffItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const query = new URLSearchParams()
  if (params?.q) query.set('q', params.q)
  if (params?.role) query.set('role', params.role)
  if (params?.status) query.set('status', params.status)
  if (params?.organizationType) query.set('organizationType', params.organizationType)
  if (params?.distributorId) query.set('distributorId', params.distributorId)
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  const qs = query.toString()
  return adminFetchDetail(`/admin/staff${qs ? `?${qs}` : ''}`)
}

export async function createAdminStaff(body: {
  name: string
  email: string
  role: string
  distributorId?: number | null
  temporaryPassword?: string
  isActive?: boolean
}): Promise<AdminStaffItem> {
  return adminFetchDetail('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminStaff(
  id: string,
  body: { name?: string; role?: string; distributorId?: number | null; clearDistributor?: boolean },
): Promise<AdminStaffItem> {
  return adminFetchDetail(`/admin/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function activateAdminStaff(id: string): Promise<AdminStaffItem> {
  return adminFetchDetail(`/admin/staff/${id}/activate`, { method: 'POST' })
}

export async function deactivateAdminStaff(id: string): Promise<AdminStaffItem> {
  return adminFetchDetail(`/admin/staff/${id}/deactivate`, { method: 'POST' })
}

export async function deleteAdminStaff(id: string): Promise<void> {
  await adminFetchDetail(`/admin/staff/${id}`, { method: 'DELETE' })
}

export async function resetAdminStaffPassword(
  id: string,
  temporaryPassword?: string,
): Promise<AdminStaffItem> {
  return adminFetchDetail(`/admin/staff/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(temporaryPassword ? { temporaryPassword } : {}),
  })
}

// (legacy mock save removed — real API above)


// ?? Admin-05 ?????????????????????????????????????????????????

const MOCK_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'AUTOON',
  contactEmail: 'support@autoon.kr',
  commissionRate: 3.5,
  basicPlanPrice: 29000,
  proPlanPrice: 59000,
  premiumPlanPrice: 99000,
  freeTrialDays: 14,
  maintenanceMode: false,
}

const MOCK_SYSTEM_STATUS: SystemStatus = {
  apiStatus: 'healthy',
  dbStatus: 'healthy',
  uptime: 864000,
  version: '0.1.1',
  lastDeployAt: '2026-06-28T03:00:00Z',
  activeConnections: 42,
}

const MOCK_LOGIN_LOGS: AdminLoginLog[] = [
  {
    id: 'log1',
    adminEmail: 'admin@washon.kr',
    ip: '203.0.113.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0',
    success: true,
    createdAt: '2026-06-28T09:15:00Z',
  },
  {
    id: 'log2',
    adminEmail: 'admin@washon.kr',
    ip: '198.51.100.5',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1',
    success: false,
    createdAt: '2026-06-27T22:30:00Z',
  },
]

let mockBlockedIps: BlockedIp[] = [
  {
    id: 'ip1',
    ip: '192.0.2.100',
    reason: '??? ??? ??',
    blockedAt: '2026-06-26T10:00:00Z',
    blockedBy: 'admin@washon.kr',
  },
]

// TODO: GET /api/v1/admin/settings/platform ? ??? ???
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  try {
    return await adminFetch<PlatformSettings>('/admin/settings/platform')
  } catch {
    if (!isDev) throw new Error('???? ?? ??')
    console.warn('[Admin][Dev] fetchPlatformSettings ? mock')
    return { ...MOCK_PLATFORM_SETTINGS }
  }
}

// TODO: PATCH /api/v1/admin/settings/platform ? ??? ???
export async function savePlatformSettings(data: Partial<PlatformSettings>): Promise<void> {
  try {
    await adminFetch('/admin/settings/platform', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch {
    if (!isDev) throw new Error('???? ?? ??')
    console.warn('[Admin][Dev] savePlatformSettings ? mock', data)
  }
}

// TODO: GET /api/v1/admin/system/status ? ??? ???
export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    return await adminFetch<SystemStatus>('/admin/system/status')
  } catch {
    if (!isDev) throw new Error('??? ?? API ???')
    console.warn('[Admin][Dev] fetchSystemStatus ? mock')
    return { ...MOCK_SYSTEM_STATUS }
  }
}

// TODO: GET /api/v1/admin/security/login-logs ? ??? ???
export async function fetchAdminLoginLogs(params?: {
  page?: number
  limit?: number
}): Promise<AdminLoginLog[]> {
  try {
    const query = new URLSearchParams()
    query.set('limit', String(params?.limit ?? 20))
    if (params?.page) query.set('page', String(params.page))
    const data = await adminFetch<unknown>(`/admin/security/login-logs?${query}`)
    return parseList<AdminLoginLog>(data, ['logs', 'items'])
  } catch {
    if (!isDev) throw new Error('??? ?? ?? ??')
    console.warn('[Admin][Dev] fetchAdminLoginLogs ? mock')
    return MOCK_LOGIN_LOGS
  }
}

// TODO: GET /api/v1/admin/security/blocked-ips ? ??? ???
export async function fetchBlockedIps(): Promise<BlockedIp[]> {
  try {
    const data = await adminFetch<unknown>('/admin/security/blocked-ips')
    return parseList<BlockedIp>(data, ['ips', 'items'])
  } catch {
    if (!isDev) throw new Error('?? IP ?? ?? ??')
    console.warn('[Admin][Dev] fetchBlockedIps ? mock')
    return [...mockBlockedIps]
  }
}

// TODO: POST /api/v1/admin/security/blocked-ips ? ??? ??? (?? ???, ?? ?? ???)
export async function blockIp(ip: string, reason: string): Promise<void> {
  try {
    await adminFetch('/admin/security/blocked-ips', {
      method: 'POST',
      body: JSON.stringify({ ip, reason }),
    })
  } catch {
    if (!isDev) throw new Error('IP ?? ?? ??')
    console.warn('[Admin][Dev] blockIp ? mock', { ip, reason })
    mockBlockedIps = [
      {
        id: `ip-${Date.now()}`,
        ip,
        reason,
        blockedAt: new Date().toISOString(),
        blockedBy: 'admin@washon.kr',
      },
      ...mockBlockedIps.filter((b) => b.ip !== ip),
    ]
  }
}

// TODO: DELETE /api/v1/admin/security/blocked-ips ? ??? ???
export async function unblockIp(ip: string): Promise<void> {
  try {
    await adminFetch('/admin/security/blocked-ips', {
      method: 'DELETE',
      body: JSON.stringify({ ip }),
    })
  } catch {
    if (!isDev) throw new Error('IP ?? ?? ??')
    console.warn('[Admin][Dev] unblockIp ? mock', ip)
    mockBlockedIps = mockBlockedIps.filter((b) => b.ip !== ip)
  }
}

// ?? Admin Ad Applications (? API, mock fallback ??) ?????????

const AD_APPLICATION_STATUSES: AdApplicationStatus[] = [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'ACTIVE',
  'ENDED',
]

const AD_PRODUCT_TYPES: AdApplicationProductType[] = ['exposure', 'ad', 'automation']

const AD_BILLING_TYPES: AdBillingType[] = ['monthly', 'one_time']

function toDateOnly(value: unknown): string | null {
  if (value == null || value === '') return null
  return String(value).slice(0, 10)
}

function normalizeAdApplicationStatus(value: unknown): AdApplicationStatus {
  const raw = String(value ?? 'PENDING_REVIEW').toUpperCase()
  if (AD_APPLICATION_STATUSES.includes(raw as AdApplicationStatus)) {
    return raw as AdApplicationStatus
  }
  const legacy: Record<string, AdApplicationStatus> = {
    PENDING: 'PENDING_REVIEW',
    PENDING_REVIEW: 'PENDING_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    ACTIVE: 'ACTIVE',
    ENDED: 'ENDED',
  }
  return legacy[raw] ?? 'PENDING_REVIEW'
}

function normalizeProductType(value: unknown): AdApplicationProductType {
  const raw = String(value ?? 'ad').toLowerCase()
  if (AD_PRODUCT_TYPES.includes(raw as AdApplicationProductType)) {
    return raw as AdApplicationProductType
  }
  return 'ad'
}

function normalizeBillingType(value: unknown): AdBillingType {
  const raw = String(value ?? 'monthly').toLowerCase()
  if (AD_BILLING_TYPES.includes(raw as AdBillingType)) {
    return raw as AdBillingType
  }
  if (raw === 'one-time' || raw === 'onetime') return 'one_time'
  return 'monthly'
}

function mapStatusHistoryEntry(
  entry: Record<string, unknown>,
): AdminAdApplication['statusHistory'][number] {
  return {
    id: String(entry.id ?? `hist-${entry.changed_at ?? entry.changedAt ?? Date.now()}`),
    status: normalizeAdApplicationStatus(entry.status),
    changedAt: String(entry.changed_at ?? entry.changedAt ?? ''),
    note: String(entry.note ?? entry.message ?? ''),
    by: (entry.by === 'system' ? 'system' : 'admin') as 'admin' | 'system',
  }
}

function mapAdApplication(row: Record<string, unknown>): AdminAdApplication {
  const historyRaw =
    (row.status_history as Record<string, unknown>[] | undefined) ??
    (row.statusHistory as Record<string, unknown>[] | undefined) ??
    []

  return {
    id: String(row.id),
    businessId: String(row.business_id ?? row.businessId ?? ''),
    businessName: String(row.business_name ?? row.businessName ?? ''),
    ownerName: String(row.owner_name ?? row.ownerName ?? ''),
    ownerPhone: String(row.owner_phone ?? row.ownerPhone ?? row.phone ?? ''),
    ownerEmail: String(row.owner_email ?? row.ownerEmail ?? row.email ?? ''),
    productId: String(row.product_id ?? row.productId ?? ''),
    productName: String(row.product_name ?? row.productName ?? ''),
    productType: normalizeProductType(row.product_type ?? row.productType),
    billingType: normalizeBillingType(row.billing_type ?? row.billingType),
    amount: Number(row.amount ?? 0),
    appliedAt: toDateOnly(row.applied_at ?? row.appliedAt ?? row.created_at ?? row.createdAt) ?? '',
    status: normalizeAdApplicationStatus(row.status),
    startDate: toDateOnly(row.start_date ?? row.startDate),
    endDate: toDateOnly(row.end_date ?? row.endDate),
    applicationMemo: String(row.application_memo ?? row.applicationMemo ?? row.memo ?? ''),
    adminMemo: String(row.admin_memo ?? row.adminMemo ?? ''),
    rejectReason:
      row.reject_reason != null
        ? String(row.reject_reason)
        : row.rejectReason != null
          ? String(row.rejectReason)
          : undefined,
    statusHistory: historyRaw.map(mapStatusHistoryEntry),
  }
}

function unwrapAdApplication(data: unknown): AdminAdApplication {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const nested = obj.application ?? obj.item
    if (nested && typeof nested === 'object') {
      return mapAdApplication(nested as Record<string, unknown>)
    }
    if ('id' in obj) {
      return mapAdApplication(obj)
    }
  }
  throw new Error('?? ?? ?? ??? ???? ????.')
}

// ?? Admin Subscriptions ??????????????????????????????????????

export type AdminSubscriptionPlanTier = 'BASIC' | 'STANDARD' | 'PREMIUM'

export type AdminSubscriptionApiStatus =
  | 'FREE_TRIAL'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'TERMINATED'

export type AdminSubscriptionApiPaymentStatus =
  | 'NONE'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'OVERDUE'

export type AdminSubscriptionEventItem = {
  id: number
  eventType: string
  fromPlanTier: string | null
  toPlanTier: string | null
  fromStatus: string | null
  toStatus: string | null
  actorType: string
  actorId: number | null
  reason: string | null
  createdAt: string
}

export type AdminSubscriptionItem = {
  id: number
  partnerId: number
  businessName: string
  ownerName: string | null
  phone: string | null
  planTier: AdminSubscriptionPlanTier | string
  monthlyFee: number
  platformFeeRate: number
  status: string
  paymentStatus: string
  trialStartedAt: string | null
  trialEndsAt: string | null
  currentPeriodStartedAt: string | null
  currentPeriodEndsAt: string | null
  nextPaymentAt: string | null
  autoRenewal: boolean
  adminMemo: string
  createdAt: string
  updatedAt: string | null
  partnerCreatedAt?: string | null
  isFreeTrial: boolean
  events?: AdminSubscriptionEventItem[]
}

export type AdminSubscriptionListResult = {
  items: AdminSubscriptionItem[]
  total: number
  page: number
  pageSize: number
}

export type AdminSubscriptionActionResult = {
  success: boolean
  message: string
  subscription: AdminSubscriptionItem
}

/** GET /admin/subscriptions */
export async function fetchAdminSubscriptions(params?: {
  keyword?: string
  planTier?: string
  status?: string
  paymentStatus?: string
  page?: number
  pageSize?: number
}): Promise<AdminSubscriptionListResult> {
  const query = new URLSearchParams()
  if (params?.keyword?.trim()) query.set('keyword', params.keyword.trim())
  if (params?.planTier && params.planTier !== 'all') query.set('planTier', params.planTier)
  if (params?.status && params.status !== 'all') query.set('status', params.status)
  if (params?.paymentStatus && params.paymentStatus !== 'all') {
    query.set('paymentStatus', params.paymentStatus)
  }
  query.set('page', String(params?.page ?? 1))
  query.set('pageSize', String(params?.pageSize ?? 20))
  const data = await adminFetch<AdminSubscriptionListResult>(`/admin/subscriptions?${query}`)
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 20,
  }
}

/** GET /admin/subscriptions/{partnerId} */
export async function fetchAdminSubscriptionDetail(
  partnerId: number,
): Promise<AdminSubscriptionItem> {
  return adminFetch(`/admin/subscriptions/${partnerId}`)
}

/** PATCH /admin/subscriptions/{partnerId}/plan */
export async function updateAdminSubscriptionPlan(
  partnerId: number,
  planTier: AdminSubscriptionPlanTier,
  reason?: string,
): Promise<AdminSubscriptionActionResult> {
  return adminFetch(`/admin/subscriptions/${partnerId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ planTier, reason: reason ?? '' }),
  })
}

/** PATCH /admin/subscriptions/{partnerId}/trial */
export async function updateAdminSubscriptionTrial(
  partnerId: number,
  trialEndsAt: string,
  reason?: string,
): Promise<AdminSubscriptionActionResult> {
  return adminFetch(`/admin/subscriptions/${partnerId}/trial`, {
    method: 'PATCH',
    body: JSON.stringify({ trialEndsAt, reason: reason ?? '' }),
  })
}

/** PATCH /admin/subscriptions/{partnerId}/status */
export async function updateAdminSubscriptionStatus(
  partnerId: number,
  status: AdminSubscriptionApiStatus | string,
  reason?: string,
): Promise<AdminSubscriptionActionResult> {
  return adminFetch(`/admin/subscriptions/${partnerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason: reason ?? '' }),
  })
}

/** PATCH /admin/subscriptions/{partnerId}/memo */
export async function updateAdminSubscriptionMemo(
  partnerId: number,
  adminMemo: string,
): Promise<AdminSubscriptionActionResult> {
  return adminFetch(`/admin/subscriptions/${partnerId}/memo`, {
    method: 'PATCH',
    body: JSON.stringify({ adminMemo }),
  })
}

/** PATCH /admin/subscriptions/{partnerId}/auto-renewal */
export async function updateAdminSubscriptionAutoRenewal(
  partnerId: number,
  autoRenewal: boolean,
): Promise<AdminSubscriptionActionResult> {
  return adminFetch(`/admin/subscriptions/${partnerId}/auto-renewal`, {
    method: 'PATCH',
    body: JSON.stringify({ autoRenewal }),
  })
}

/** POST /admin/subscriptions/{partnerId}/terminate */
export async function terminateAdminSubscription(
  partnerId: number,
  reason?: string,
): Promise<AdminSubscriptionActionResult> {
  return adminFetch(`/admin/subscriptions/${partnerId}/terminate`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? '' }),
  })
}

/**
 * ?? ?? API
 */
export async function fetchAdAppApplications(params?: {
  status?: AdApplicationStatus | 'all'
}): Promise<AdminAdApplication[]> {
  const query = new URLSearchParams()
  if (params?.status && params.status !== 'all') {
    query.set('status', params.status)
  }
  const qs = query.toString()
  const data = await adminFetch<unknown>(`/admin/ad-applications${qs ? `?${qs}` : ''}`)
  const list = parseList<Record<string, unknown>>(data, ['applications', 'items'])
  return list.map(mapAdApplication)
}

/** POST /admin/ad-applications/{id}/approve */
export async function approveAdApp(
  id: string,
  input: { startDate: string; endDate: string; adminMemo: string },
): Promise<AdminAdApplication> {
  const data = await adminFetch<unknown>(`/admin/ad-applications/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      start_date: input.startDate,
      end_date: input.endDate,
      admin_memo: input.adminMemo,
    }),
  })
  return unwrapAdApplication(data)
}

/** POST /admin/ad-applications/{id}/reject */
export async function rejectAdApp(
  id: string,
  input: { rejectReason: string; adminMemo: string },
): Promise<AdminAdApplication> {
  const data = await adminFetch<unknown>(`/admin/ad-applications/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({
      reject_reason: input.rejectReason,
      admin_memo: input.adminMemo,
    }),
  })
  return unwrapAdApplication(data)
}

/** POST /admin/ad-applications/{id}/end */
export async function endAdApp(
  id: string,
  input?: { adminMemo?: string },
): Promise<AdminAdApplication> {
  const data = await adminFetch<unknown>(`/admin/ad-applications/${id}/end`, {
    method: 'POST',
    body: JSON.stringify({
      admin_memo: input?.adminMemo ?? '',
    }),
  })
  return unwrapAdApplication(data)
}

// ?? Admin Coupons (read-only monitoring) ?????????????????????

export type AdminCouponItem = {
  id: number
  partnerId: number
  businessName: string
  bizType: string | null
  name: string
  discountType: 'amount' | 'percent' | string
  discountValue: number
  minOrderAmount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  source: 'manual' | 'birthday_auto' | string
  status: 'issued' | 'used' | 'expired' | 'cancelled' | null
  issuedCount: number
  usedCount: number
  createdAt: string
}

export type AdminCouponListResult = {
  items: AdminCouponItem[]
  total: number
  page: number
  pageSize: number
}

export type AdminCouponMetrics = {
  totalCoupons: number
  activeCoupons: number
  totalIssued: number
  totalUsed: number
  usageRate: number
  bySource: { source: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

/** GET /admin/coupons */
export async function fetchAdminCoupons(params?: {
  partnerId?: number
  source?: string
  status?: string
  isActive?: boolean | 'all'
  dateFrom?: string
  dateTo?: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<AdminCouponListResult> {
  const query = new URLSearchParams()
  if (params?.partnerId != null) query.set('partnerId', String(params.partnerId))
  if (params?.source && params.source !== 'all') query.set('source', params.source)
  if (params?.status && params.status !== 'all') query.set('status', params.status)
  if (params?.isActive === true || params?.isActive === false) {
    query.set('isActive', String(params.isActive))
  }
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params?.dateTo) query.set('dateTo', params.dateTo)
  if (params?.keyword?.trim()) query.set('keyword', params.keyword.trim())
  query.set('page', String(params?.page ?? 1))
  query.set('pageSize', String(params?.pageSize ?? 20))
  const data = await adminFetch<AdminCouponListResult>(`/admin/coupons?${query}`)
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 20,
  }
}

/** GET /admin/coupons/metrics */
export async function fetchAdminCouponMetrics(params?: {
  dateFrom?: string
  dateTo?: string
}): Promise<AdminCouponMetrics> {
  const query = new URLSearchParams()
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params?.dateTo) query.set('dateTo', params.dateTo)
  const qs = query.toString()
  return adminFetch<AdminCouponMetrics>(`/admin/coupons/metrics${qs ? `?${qs}` : ''}`)
}

// ?? Admin Banners (platform CMS) ?????????????????????????????

export type BannerPlacement =
  | 'HOME_TOP'
  | 'CATEGORY_LIST'
  | 'STORE_DETAIL'
  | 'EVENT'
  | 'WEB_MAIN'

export type BannerLinkType = 'STORE' | 'EXTERNAL_URL' | 'NONE'

export type BannerStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED'

export type AdminBanner = {
  id: number
  title: string
  subtitle: string | null
  imageUrl: string | null
  placement: BannerPlacement | string
  linkType: BannerLinkType | string
  linkValue: string | null
  partnerId: number | null
  adApplicationId: number | null
  startAt: string | null
  endAt: string | null
  displayOrder: number
  status: BannerStatus | string
  effectiveStatus: BannerStatus | string
  impressionCount: number
  clickCount: number
  createdBy: number
  createdAt: string
  updatedAt: string | null
}

export type BannerListResponse = {
  items: AdminBanner[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type BannerMetrics = {
  total: number
  active: number
  scheduled: number
  paused: number
  ended: number
  totalImpressions: number
  totalClicks: number
  criteria?: string
}

export type AdminBannerCreateInput = {
  title: string
  subtitle?: string | null
  placement: string
  linkType?: string
  linkValue?: string | null
  partnerId?: number | null
  adApplicationId?: number | null
  startAt?: string | null
  endAt?: string | null
  displayOrder?: number
  status?: string
}

export type AdminBannerUpdateInput = {
  title?: string
  subtitle?: string | null
  placement?: string
  linkType?: string
  linkValue?: string | null
  partnerId?: number | null
  adApplicationId?: number | null
  startAt?: string | null
  endAt?: string | null
  displayOrder?: number
  clearSubtitle?: boolean
  clearLinkValue?: boolean
  clearPartnerId?: boolean
  clearAdApplicationId?: boolean
  clearStartAt?: boolean
  clearEndAt?: boolean
}

async function adminFetchDetail<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAdminToken()}`,
    ...(options?.headers as Record<string, string> | undefined),
  }
  // Only set JSON content-type when body is a string (not FormData)
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

/** GET /admin/banners */
export async function getAdminBanners(params?: {
  placement?: string
  status?: string
  partnerId?: number
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<BannerListResponse> {
  const query = new URLSearchParams()
  if (params?.placement && params.placement !== 'all') query.set('placement', params.placement)
  if (params?.status && params.status !== 'all') query.set('status', params.status)
  if (params?.partnerId != null && !Number.isNaN(params.partnerId)) {
    query.set('partnerId', String(params.partnerId))
  }
  if (params?.keyword?.trim()) query.set('keyword', params.keyword.trim())
  query.set('page', String(params?.page ?? 1))
  query.set('pageSize', String(params?.pageSize ?? 20))
  const data = await adminFetchDetail<BannerListResponse>(`/admin/banners?${query}`)
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 20,
    totalPages: data.totalPages ?? 0,
  }
}

/** GET /admin/banners/{id} */
export async function getAdminBanner(id: number): Promise<AdminBanner> {
  return adminFetchDetail<AdminBanner>(`/admin/banners/${id}`)
}

/** GET /admin/banners/metrics */
export async function getBannerMetrics(): Promise<BannerMetrics> {
  return adminFetchDetail<BannerMetrics>('/admin/banners/metrics')
}

/** POST /admin/banners */
export async function createBanner(payload: AdminBannerCreateInput): Promise<AdminBanner> {
  return adminFetchDetail<AdminBanner>('/admin/banners', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** PUT /admin/banners/{id} */
export async function updateBanner(
  id: number,
  payload: AdminBannerUpdateInput,
): Promise<AdminBanner> {
  return adminFetchDetail<AdminBanner>(`/admin/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/** PATCH /admin/banners/{id}/status */
export async function updateBannerStatus(
  id: number,
  status: BannerStatus | string,
): Promise<AdminBanner> {
  return adminFetchDetail<AdminBanner>(`/admin/banners/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/** PATCH /admin/banners/reorder ? same placement only */
export async function reorderBanners(
  items: { id: number; displayOrder: number }[],
): Promise<AdminBanner[]> {
  return adminFetchDetail<AdminBanner[]>('/admin/banners/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })
}

/** DELETE /admin/banners/{id} */
export async function deleteBanner(id: number): Promise<void> {
  await adminFetchDetail<void>(`/admin/banners/${id}`, { method: 'DELETE' })
}

/** POST /admin/banners/{id}/image ? multipart field name: file */
export async function uploadBannerImage(
  id: number,
  file: File,
): Promise<{ id: number; imageUrl: string; updatedAt: string | null }> {
  const form = new FormData()
  form.append('file', file)
  return adminFetchDetail(`/admin/banners/${id}/image`, {
    method: 'POST',
    body: form,
  })
}

// --- Admin Notifications ---

export type AdminNotificationType =
  | 'ENTRY_APPLICATION'
  | 'AD_APPLICATION'
  | 'NEW_RESERVATION'
  | 'NEW_MEMBER'
  | 'BANNER'
  | 'COUPON'
  | 'SYSTEM'

export type AdminNotificationItem = {
  id: string
  type: AdminNotificationType | string
  title: string
  message: string
  linkPath: string | null
  entityType: string | null
  entityId: string | null
  isRead: boolean
  createdAt: string
  readAt: string | null
}

export type AdminNotificationListResponse = {
  items: AdminNotificationItem[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
  totalPages: number
}

/** Safe internal Admin path only (no external URLs). */
export function resolveAdminNotificationPath(linkPath: string | null | undefined): string | null {
  if (!linkPath) return null
  const path = linkPath.trim()
  if (!path.startsWith('/admin/')) return null
  if (path.includes('://') || path.includes('\\') || path.includes('..')) return null
  return path
}

/** GET /admin/notifications */
export async function fetchAdminNotifications(params?: {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
  type?: string
}): Promise<AdminNotificationListResponse> {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.pageSize) q.set('pageSize', String(params.pageSize))
  if (params?.unreadOnly) q.set('unreadOnly', 'true')
  if (params?.type) q.set('type', params.type)
  const qs = q.toString()
  return adminFetchDetail<AdminNotificationListResponse>(
    `/admin/notifications${qs ? `?${qs}` : ''}`,
  )
}

/** GET /admin/notifications/unread-count */
export async function fetchAdminNotificationsUnreadCount(): Promise<number> {
  const data = await adminFetchDetail<{ unreadCount: number }>(
    '/admin/notifications/unread-count',
  )
  return data.unreadCount
}

/** PATCH /admin/notifications/{id}/read */
export async function markAdminNotificationRead(
  id: string,
): Promise<AdminNotificationItem> {
  const data = await adminFetchDetail<{ item: AdminNotificationItem }>(
    `/admin/notifications/${id}/read`,
    { method: 'PATCH' },
  )
  return data.item
}

/** PATCH /admin/notifications/read-all */
export async function markAllAdminNotificationsRead(): Promise<{
  updated: number
  unreadCount: number
}> {
  return adminFetchDetail('/admin/notifications/read-all', { method: 'PATCH' })
}
// --- Admin Franchises ---

export type FranchiseStatus = 'ACTIVE' | 'PAUSED' | 'ENDED'
export type FranchisePartnerRole = 'HEADQUARTERS' | 'BRANCH'

export type AdminFranchiseListItem = {
  id: string
  name: string
  logoUrl: string | null
  status: FranchiseStatus | string
  headquartersPartnerId: string | null
  headquartersName: string | null
  partnerCount: number
  activePartnerCount: number
  todayReservations: number
  monthReservations: number
  todayRevenue: number
  monthRevenue: number
  contractStartDate: string | null
  contractEndDate: string | null
  createdAt: string
}

export type AdminFranchiseDetail = AdminFranchiseListItem & {
  businessNumber: string | null
  representativeName: string | null
  contactPhone: string | null
  contactEmail: string | null
  memo: string | null
  updatedAt: string | null
  partners: AdminFranchisePartnerItem[]
}

export type AdminFranchisePartnerItem = {
  id: string
  partnerId: string
  businessName: string
  bizType: string | null
  region: string | null
  partnerStatus: string
  role: FranchisePartnerRole | string
  joinedAt: string
  leftAt: string | null
  isActive: boolean
  todayReservations: number
  monthReservations: number
  monthRevenue: number
}

export type AdminFranchiseMetrics = {
  totalFranchises: number
  activeFranchises: number
  totalPartners: number
  activePartners: number
  todayReservations: number
  monthRevenue: number
}

export type AdminFranchiseSummary = {
  franchiseId: string
  totalPartners: number
  activePartners: number
  todayReservations: number
  monthReservations: number
  todayRevenue: number
  monthRevenue: number
}

export type AdminFranchiseDetailBundle = {
  franchise: AdminFranchiseDetail
  summary: AdminFranchiseSummary
  recentReservations: Array<{
    id: string
    partnerId: string
    businessName: string
    customerName: string | null
    bookingDate: string
    startTime: string | null
    status: string
    price: number
  }>
}

export type AdminFranchiseListResponse = {
  items: AdminFranchiseListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function fetchAdminFranchiseMetrics(): Promise<AdminFranchiseMetrics> {
  return adminFetchDetail('/admin/franchises/metrics')
}

export async function fetchAdminFranchises(params?: {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<AdminFranchiseListResponse> {
  const q = new URLSearchParams()
  if (params?.keyword) q.set('keyword', params.keyword)
  if (params?.status && params.status !== 'all') q.set('status', params.status)
  q.set('page', String(params?.page ?? 1))
  q.set('pageSize', String(params?.pageSize ?? 20))
  return adminFetchDetail(`/admin/franchises?${q}`)
}

export async function fetchAdminFranchiseDetail(
  id: string,
): Promise<AdminFranchiseDetailBundle> {
  return adminFetchDetail(`/admin/franchises/${id}`)
}

export async function createAdminFranchise(body: {
  name: string
  businessNumber?: string | null
  representativeName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  logoUrl?: string | null
  status?: FranchiseStatus
  contractStartDate?: string | null
  contractEndDate?: string | null
  memo?: string | null
  headquartersPartnerId?: number | null
}): Promise<AdminFranchiseDetail> {
  return adminFetchDetail('/admin/franchises', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminFranchise(
  id: string,
  body: Record<string, unknown>,
): Promise<AdminFranchiseDetail> {
  return adminFetchDetail(`/admin/franchises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function updateAdminFranchiseStatus(
  id: string,
  status: FranchiseStatus,
): Promise<AdminFranchiseDetail> {
  return adminFetchDetail(`/admin/franchises/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteAdminFranchise(id: string): Promise<void> {
  await adminFetchDetail(`/admin/franchises/${id}`, { method: 'DELETE' })
}

export async function fetchAdminFranchisePartners(
  id: string,
  params?: { keyword?: string; page?: number; pageSize?: number },
): Promise<{
  items: AdminFranchisePartnerItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const q = new URLSearchParams()
  if (params?.keyword) q.set('keyword', params.keyword)
  q.set('page', String(params?.page ?? 1))
  q.set('pageSize', String(params?.pageSize ?? 20))
  return adminFetchDetail(`/admin/franchises/${id}/partners?${q}`)
}

export async function linkAdminFranchisePartner(
  id: string,
  body: { partnerId: number; role?: FranchisePartnerRole; joinedAt?: string },
): Promise<AdminFranchisePartnerItem> {
  return adminFetchDetail(`/admin/franchises/${id}/partners`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function unlinkAdminFranchisePartner(
  id: string,
  partnerId: string,
): Promise<void> {
  await adminFetchDetail(`/admin/franchises/${id}/partners/${partnerId}`, {
    method: 'DELETE',
  })
}

// --- Admin Sales ---
export type SalesOrgStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type SalesEmploymentType = 'FREELANCER' | 'AGENCY' | 'DISTRIBUTOR' | 'DIRECT'

export type AdminSalesMetrics = {
  distributorCount: number
  agencyCount: number
  agentCount: number
  assignedPartnerCount: number
  unassignedPartnerCount: number
  estimatedMonthlyCommission: number
  activeCommissionPartnerCount: number
}

export type AdminSalesAgentAccountStatus = 'NONE' | 'ACTIVE' | 'INACTIVE'

export type AdminSalesDistributor = {
  id: string
  name: string
  code: string
  representativeName: string | null
  phone: string | null
  email: string | null
  region: string | null
  status: SalesOrgStatus | string
  memo: string | null
  agencyCount: number
  agentCount: number
  partnerCount: number
  estimatedMonthlyCommission: number
  createdAt: string
  updatedAt: string | null
  hasAccount?: boolean
  accountStatus?: AdminSalesAgentAccountStatus | string
  accountEmail?: string | null
}

export type AdminSalesAgency = {
  id: string
  distributorId: string
  distributorName: string | null
  name: string
  code: string
  representativeName: string | null
  phone: string | null
  email: string | null
  region: string | null
  status: SalesOrgStatus | string
  memo: string | null
  agentCount: number
  partnerCount: number
  estimatedMonthlyCommission: number
  createdAt: string
  updatedAt: string | null
  hasAccount?: boolean
  accountStatus?: AdminSalesAgentAccountStatus | string
  accountEmail?: string | null
}

export type AdminSalesAgent = {
  id: string
  name: string
  code: string
  phone: string | null
  email: string | null
  status: SalesOrgStatus | string
  employmentType: SalesEmploymentType | string
  distributorId: string | null
  distributorName: string | null
  agencyId: string | null
  agencyName: string | null
  partnerCount: number
  estimatedMonthlyCommission: number
  joinedAt: string | null
  memo: string | null
  createdAt: string
  updatedAt: string | null
  hasAccount?: boolean
  accountStatus?: AdminSalesAgentAccountStatus | string
  accountEmail?: string | null
}

export type AdminSalesAgentAccount = {
  hasAccount: boolean
  userId: string | null
  email: string | null
  isActive: boolean | null
  lastLoginAt: string | null
  createdAt: string | null
}

export type AdminSalesAssignment = {
  id: string
  partnerId: string
  partnerName: string
  bizType: string | null
  planTier: string | null
  salesAgentId: string
  salesAgentName: string
  agencyId: string | null
  agencyName: string | null
  distributorId: string | null
  distributorName: string | null
  assignedAt: string
  memo: string | null
  estimatedMonthlyCommission: number
}

export type AdminSalesUnassignedPartner = {
  partnerId: string
  partnerName: string
  bizType: string | null
  planTier: string | null
  status: string
  region: string | null
}

export type AdminSalesListResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type AdminSalesCommissionPolicy = {
  id: string
  name: string
  isDefault: boolean
  agentRate: number | string
  agencyRate: number | string
  distributorRate: number | string
  rateMonth1: number | string
  rateMonth2: number | string
  rateMonth3To12: number | string
  totalRate: number | string
  durationMonths: number
  basis: string
  status: string
  appliesToPlan: string | null
  startsAt: string
  endsAt: string | null
  updatedAt: string | null
}

export type AdminSalesPlanExample = {
  planTier: string
  baseAmount?: number
  monthlyFee?: number
  agentCommission: number
  agencyCommission: number
  distributorCommission: number
  totalCommission: number
  annualTotal: number
  vatExcluded?: boolean
  monthExamples?: Array<{
    monthIndex: number
    tierRate: number
    agentCommission: number
    agencyCommission: number
    distributorCommission: number
    totalCommission: number
  }>
}

export type AdminSalesCommissionPreviewItem = {
  partnerId: string
  partnerName: string
  planTier: string
  estimated: boolean
  baseAmount: number
  agentCommission: number
  agencyCommission: number
  distributorCommission: number
  totalCommission: number
  commissionMonth: number
  remainingMonths: number
  appliedTierRate?: number | string | null
  nextMonthIndex?: number | null
  nextMonthTierRate?: number | string | null
  nextMonthAgentCommission?: number
  salesAgentId: string | null
  salesAgentName: string | null
  agencyName: string | null
  distributorName: string | null
  note: string | null
}

export type AdminSalesCommissionPreview = {
  items: AdminSalesCommissionPreviewItem[]
  totalEstimatedMonthlyCommission: number
  policy: AdminSalesCommissionPolicy
  planExamples: AdminSalesPlanExample[]
}

function salesQs(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export async function fetchAdminSalesMetrics(): Promise<AdminSalesMetrics> {
  return adminFetchDetail('/admin/sales/metrics')
}

export async function fetchAdminSalesDistributors(params?: {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<AdminSalesListResponse<AdminSalesDistributor>> {
  return adminFetchDetail(
    `/admin/sales/distributors${salesQs({
      keyword: params?.keyword,
      status: params?.status,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

export async function createAdminSalesDistributor(body: {
  name: string
  code: string
  representativeName?: string | null
  phone?: string | null
  email?: string | null
  region?: string | null
  status?: SalesOrgStatus
  memo?: string | null
}): Promise<AdminSalesDistributor> {
  return adminFetchDetail('/admin/sales/distributors', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesDistributor(
  id: string,
  body: Record<string, unknown>,
): Promise<AdminSalesDistributor> {
  return adminFetchDetail(`/admin/sales/distributors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesDistributorStatus(
  id: string,
  status: SalesOrgStatus,
): Promise<AdminSalesDistributor> {
  return adminFetchDetail(`/admin/sales/distributors/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteAdminSalesDistributor(id: string): Promise<void> {
  await adminFetchDetail(`/admin/sales/distributors/${id}`, { method: 'DELETE' })
}

export async function fetchAdminSalesAgencies(params?: {
  keyword?: string
  status?: string
  distributorId?: string | number
  page?: number
  pageSize?: number
}): Promise<AdminSalesListResponse<AdminSalesAgency>> {
  return adminFetchDetail(
    `/admin/sales/agencies${salesQs({
      keyword: params?.keyword,
      status: params?.status,
      distributorId: params?.distributorId,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

export async function createAdminSalesAgency(body: {
  distributorId: number
  name: string
  code: string
  representativeName?: string | null
  phone?: string | null
  email?: string | null
  region?: string | null
  status?: SalesOrgStatus
  memo?: string | null
}): Promise<AdminSalesAgency> {
  return adminFetchDetail('/admin/sales/agencies', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesAgency(
  id: string,
  body: Record<string, unknown>,
): Promise<AdminSalesAgency> {
  return adminFetchDetail(`/admin/sales/agencies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesAgencyStatus(
  id: string,
  status: SalesOrgStatus,
): Promise<AdminSalesAgency> {
  return adminFetchDetail(`/admin/sales/agencies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteAdminSalesAgency(id: string): Promise<void> {
  await adminFetchDetail(`/admin/sales/agencies/${id}`, { method: 'DELETE' })
}

export async function fetchAdminSalesAgents(params?: {
  keyword?: string
  status?: string
  distributorId?: string | number
  agencyId?: string | number
  employmentType?: string
  page?: number
  pageSize?: number
}): Promise<AdminSalesListResponse<AdminSalesAgent>> {
  return adminFetchDetail(
    `/admin/sales/agents${salesQs({
      keyword: params?.keyword,
      status: params?.status,
      distributorId: params?.distributorId,
      agencyId: params?.agencyId,
      employmentType: params?.employmentType,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

export async function createAdminSalesAgent(body: {
  name: string
  code: string
  phone?: string | null
  email?: string | null
  status?: SalesOrgStatus
  employmentType?: SalesEmploymentType
  distributorId?: number | null
  agencyId?: number | null
  joinedAt?: string | null
  memo?: string | null
}): Promise<AdminSalesAgent> {
  return adminFetchDetail('/admin/sales/agents', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesAgent(
  id: string,
  body: Record<string, unknown>,
): Promise<AdminSalesAgent> {
  return adminFetchDetail(`/admin/sales/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesAgentStatus(
  id: string,
  status: SalesOrgStatus,
): Promise<AdminSalesAgent> {
  return adminFetchDetail(`/admin/sales/agents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteAdminSalesAgent(id: string): Promise<void> {
  await adminFetchDetail(`/admin/sales/agents/${id}`, { method: 'DELETE' })
}

export async function fetchAdminSalesAgentAccount(
  id: string,
): Promise<AdminSalesAgentAccount> {
  return adminFetchDetail(`/admin/sales/agents/${id}/account`)
}

export async function createAdminSalesAgentAccount(
  id: string,
  body: { email: string; temporaryPassword: string; isActive?: boolean },
): Promise<AdminSalesAgentAccount> {
  return adminFetchDetail(`/admin/sales/agents/${id}/account`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesAgentAccountStatus(
  id: string,
  isActive: boolean,
): Promise<AdminSalesAgentAccount> {
  return adminFetchDetail(`/admin/sales/agents/${id}/account/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

export async function resetAdminSalesAgentAccountPassword(
  id: string,
  temporaryPassword: string,
): Promise<AdminSalesAgentAccount> {
  return adminFetchDetail(`/admin/sales/agents/${id}/account/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ temporaryPassword }),
  })
}

export type AdminSalesDistributorAccount = AdminSalesAgentAccount
export type AdminSalesAgencyAccount = AdminSalesAgentAccount

export async function fetchAdminSalesDistributorAccount(
  id: string,
): Promise<AdminSalesDistributorAccount> {
  return adminFetchDetail(`/admin/sales/distributors/${id}/account`)
}

export async function createAdminSalesDistributorAccount(
  id: string,
  body: { email: string; temporaryPassword: string; isActive?: boolean },
): Promise<AdminSalesDistributorAccount> {
  return adminFetchDetail(`/admin/sales/distributors/${id}/account`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesDistributorAccountStatus(
  id: string,
  isActive: boolean,
): Promise<AdminSalesDistributorAccount> {
  return adminFetchDetail(`/admin/sales/distributors/${id}/account/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

export async function resetAdminSalesDistributorAccountPassword(
  id: string,
  temporaryPassword: string,
): Promise<AdminSalesDistributorAccount> {
  return adminFetchDetail(`/admin/sales/distributors/${id}/account/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ temporaryPassword }),
  })
}

export type AdminSalesDistributionPolicy = {
  id: string
  distributorId: string
  distributorName: string | null
  distributorShare: number | string
  agencyShare: number | string
  agentShare: number | string
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export async function fetchAdminSalesDistributionPolicies(
  distributorId: string,
): Promise<AdminSalesDistributionPolicy[]> {
  return adminFetchDetail(`/admin/sales/distributors/${distributorId}/distribution-policy`)
}

export async function fetchAdminSalesActiveDistributionPolicy(
  distributorId: string,
): Promise<AdminSalesDistributionPolicy | null> {
  return adminFetchDetail(
    `/admin/sales/distributors/${distributorId}/distribution-policy/active`,
  )
}

export async function upsertAdminSalesDistributionPolicy(
  distributorId: string,
  body: {
    agentShare: number
    agencyShare: number
    distributorShare: number
    effectiveFrom?: string | null
  },
): Promise<AdminSalesDistributionPolicy> {
  return adminFetchDetail(`/admin/sales/distributors/${distributorId}/distribution-policy`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function fetchAdminSalesAgencyAccount(
  id: string,
): Promise<AdminSalesAgencyAccount> {
  return adminFetchDetail(`/admin/sales/agencies/${id}/account`)
}

export async function createAdminSalesAgencyAccount(
  id: string,
  body: { email: string; temporaryPassword: string; isActive?: boolean },
): Promise<AdminSalesAgencyAccount> {
  return adminFetchDetail(`/admin/sales/agencies/${id}/account`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdminSalesAgencyAccountStatus(
  id: string,
  isActive: boolean,
): Promise<AdminSalesAgencyAccount> {
  return adminFetchDetail(`/admin/sales/agencies/${id}/account/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

export async function resetAdminSalesAgencyAccountPassword(
  id: string,
  temporaryPassword: string,
): Promise<AdminSalesAgencyAccount> {
  return adminFetchDetail(`/admin/sales/agencies/${id}/account/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ temporaryPassword }),
  })
}

export async function fetchAdminSalesAssignments(params?: {
  keyword?: string
  distributorId?: string | number
  agencyId?: string | number
  agentId?: string | number
  page?: number
  pageSize?: number
}): Promise<AdminSalesListResponse<AdminSalesAssignment>> {
  return adminFetchDetail(
    `/admin/sales/assignments${salesQs({
      keyword: params?.keyword,
      distributorId: params?.distributorId,
      agencyId: params?.agencyId,
      agentId: params?.agentId,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

export async function fetchAdminSalesUnassignedPartners(params?: {
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<AdminSalesListResponse<AdminSalesUnassignedPartner>> {
  return adminFetchDetail(
    `/admin/sales/assignments/unassigned-partners${salesQs({
      keyword: params?.keyword,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

export async function createAdminSalesAssignment(body: {
  partnerId: number
  salesAgentId: number
  memo?: string | null
}): Promise<AdminSalesAssignment> {
  return adminFetchDetail('/admin/sales/assignments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function reassignAdminSalesAssignment(
  partnerId: string,
  body: { salesAgentId: number; memo?: string | null },
): Promise<AdminSalesAssignment> {
  return adminFetchDetail(`/admin/sales/assignments/${partnerId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function unassignAdminSalesAssignment(partnerId: string): Promise<void> {
  await adminFetchDetail(`/admin/sales/assignments/${partnerId}`, { method: 'DELETE' })
}

export async function fetchAdminSalesCommissionPolicy(): Promise<AdminSalesCommissionPolicy> {
  return adminFetchDetail('/admin/sales/commission-policy')
}

export async function updateAdminSalesCommissionPolicy(body: {
  name?: string | null
  agentRate?: number
  agencyRate?: number
  distributorRate?: number
  rateMonth1: number
  rateMonth2: number
  rateMonth3To12: number
  durationMonths: number
}): Promise<AdminSalesCommissionPolicy> {
  return adminFetchDetail('/admin/sales/commission-policy', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function fetchAdminSalesCommissionPreview(params?: {
  page?: number
  pageSize?: number
  partnerId?: string
}): Promise<AdminSalesCommissionPreview> {
  if (params?.partnerId) {
    return adminFetchDetail(`/admin/sales/commission-preview/${params.partnerId}`)
  }
  return adminFetchDetail('/admin/sales/commission-preview')
}

export type AdminSalesLead = {
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
  partnerName?: string | null
  partnerSlug?: string | null
  ownerLoginEmail?: string | null
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export async function fetchAdminSalesLeads(params?: {
  keyword?: string
  status?: string
  agentId?: string | number
  businessType?: string
  page?: number
  pageSize?: number
}): Promise<AdminSalesListResponse<AdminSalesLead>> {
  return adminFetchDetail(
    `/admin/sales/leads${salesQs({
      keyword: params?.keyword,
      status: params?.status,
      agentId: params?.agentId,
      businessType: params?.businessType,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

export async function fetchAdminSalesLead(id: string): Promise<AdminSalesLead> {
  return adminFetchDetail(`/admin/sales/leads/${id}`)
}

export async function approveAdminSalesLead(
  id: string,
  body: { ownerEmail: string; temporaryPassword: string; adminMemo?: string | null },
): Promise<AdminSalesLead & { message?: string; ownerLoginEmail?: string | null }> {
  return adminFetchDetail(`/admin/sales/leads/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function rejectAdminSalesLead(
  id: string,
  reason: string,
): Promise<AdminSalesLead> {
  return adminFetchDetail(`/admin/sales/leads/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

// ---------------------------------------------------------------------------
// Sales commission settlements
// ---------------------------------------------------------------------------

export type AdminSettlementBatchStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'CANCELLED'

export type AdminSettlementLineStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'HELD'
  | 'PAID'
  | 'CANCELLED'

export type AdminSettlementMetrics = {
  currentMonthEstimated: number
  currentMonthPaidSales: number
  draftAmount: number
  confirmedAmount: number
  paymentPendingAmount: number
  paidAmount: number
  heldAmount: number
  unpaidRecipientCount: number
  estimated: boolean
}

export type AdminSettlementPreview = {
  settlementMonth: string
  sourcePaymentCount: number
  eligiblePaymentCount: number
  excludedPaymentCount: number
  totalNetSales: number
  agentCommission: number
  agencyCommission: number
  distributorCommission: number
  totalCommission: number
  exclusions: Record<string, number>
  estimated: boolean
  preview: boolean
  message: string | null
}

export type AdminSettlementBatch = {
  id: string
  settlementMonth: string
  status: string
  calculationVersion: number
  sourcePaymentCount: number
  eligiblePaymentCount: number
  excludedPaymentCount: number
  totalNetSales: number
  totalAgentCommission: number
  totalAgencyCommission: number
  totalDistributorCommission: number
  totalCommission: number
  totalHeldCommission: number
  totalPayableCommission: number
  calculatedAt: string | null
  confirmedAt: string | null
  paidAt: string | null
  memo: string | null
  externalPaymentReference: string | null
  createdAt: string
  estimated: boolean
}

export type AdminSettlementBatchDetail = AdminSettlementBatch & {
  cancelReason: string | null
  paymentPendingAt: string | null
  message: string | null
}

export type AdminSettlementLine = {
  id: string
  batchId: string
  paymentRecordId: string
  partnerId: string
  partnerName: string
  planTier: string
  recipientType: string
  recipientId: string
  recipientName: string
  recipientCode: string
  paymentNetAmount: number
  commissionRate: number
  tierRate?: number | null
  commissionAmount: number
  eligibleMonthIndex: number
  commissionDurationMonths: number
  status: string
  holdReason: string | null
  policyName: string | null
  sourcePaidAt: string
  estimated: boolean
}

export type AdminSettlementLineListResponse = {
  items: AdminSettlementLine[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** GET /admin/sales/settlements/metrics */
export async function fetchAdminSalesSettlementMetrics(): Promise<AdminSettlementMetrics> {
  return adminFetchDetail('/admin/sales/settlements/metrics')
}

/** GET /admin/sales/settlements */
export async function fetchAdminSalesSettlements(params?: {
  month?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<AdminSalesListResponse<AdminSettlementBatch>> {
  return adminFetchDetail(
    `/admin/sales/settlements${salesQs({
      month: params?.month,
      status: params?.status,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

/** POST /admin/sales/settlements/preview */
export async function fetchAdminSalesSettlementPreview(body: {
  settlementMonth: string
}): Promise<AdminSettlementPreview> {
  return adminFetchDetail('/admin/sales/settlements/preview', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** POST /admin/sales/settlements */
export async function createAdminSalesSettlement(body: {
  settlementMonth: string
  memo?: string | null
}): Promise<AdminSettlementBatchDetail> {
  return adminFetchDetail('/admin/sales/settlements', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** GET /admin/sales/settlements/{id} */
export async function fetchAdminSalesSettlement(
  id: string,
): Promise<AdminSettlementBatchDetail> {
  return adminFetchDetail(`/admin/sales/settlements/${id}`)
}

/** GET /admin/sales/settlements/{id}/lines */
export async function fetchAdminSalesSettlementLines(
  id: string,
  params?: {
    recipientType?: string
    recipientName?: string
    partner?: string
    lineStatus?: string
    agencyId?: number
    distributorId?: number
    page?: number
    pageSize?: number
  },
): Promise<AdminSettlementLineListResponse> {
  return adminFetchDetail(
    `/admin/sales/settlements/${id}/lines${salesQs({
      recipientType: params?.recipientType,
      recipientName: params?.recipientName,
      partner: params?.partner,
      lineStatus: params?.lineStatus,
      agencyId: params?.agencyId,
      distributorId: params?.distributorId,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

/** POST /admin/sales/settlements/{id}/calculate */
export async function calculateAdminSalesSettlement(
  id: string,
): Promise<AdminSettlementBatchDetail> {
  return adminFetchDetail(`/admin/sales/settlements/${id}/calculate`, { method: 'POST' })
}

/** POST /admin/sales/settlements/{id}/recalculate */
export async function recalculateAdminSalesSettlement(
  id: string,
): Promise<AdminSettlementBatchDetail> {
  return adminFetchDetail(`/admin/sales/settlements/${id}/recalculate`, { method: 'POST' })
}

/** PATCH /admin/sales/settlements/{id}/confirm */
export async function confirmAdminSalesSettlement(
  id: string,
): Promise<AdminSettlementBatchDetail> {
  return adminFetchDetail(`/admin/sales/settlements/${id}/confirm`, { method: 'PATCH' })
}

/** PATCH /admin/sales/settlements/{id}/payment-pending */
export async function markAdminSalesSettlementPaymentPending(
  id: string,
): Promise<AdminSettlementBatchDetail> {
  return adminFetchDetail(`/admin/sales/settlements/${id}/payment-pending`, {
    method: 'PATCH',
  })
}

/** PATCH /admin/sales/settlements/{id}/paid */
export async function markAdminSalesSettlementPaid(
  id: string,
  body?: {
    paidAt?: string | null
    externalReference?: string | null
    memo?: string | null
  },
): Promise<AdminSettlementBatchDetail> {
  return adminFetchDetail(`/admin/sales/settlements/${id}/paid`, {
    method: 'PATCH',
    body: JSON.stringify(body ?? {}),
  })
}

/** PATCH /admin/sales/settlements/{id}/cancel */
export async function cancelAdminSalesSettlement(
  id: string,
  reason: string,
): Promise<AdminSettlementBatchDetail> {
  return adminFetchDetail(`/admin/sales/settlements/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

/** PATCH /admin/sales/settlements/{id}/lines/{lineId}/hold */
export async function holdAdminSalesSettlementLine(
  id: string,
  lineId: string,
  reason: string,
): Promise<AdminSettlementLine> {
  return adminFetchDetail(`/admin/sales/settlements/${id}/lines/${lineId}/hold`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

/** PATCH /admin/sales/settlements/{id}/lines/{lineId}/release */
export async function releaseAdminSalesSettlementLine(
  id: string,
  lineId: string,
): Promise<AdminSettlementLine> {
  return adminFetchDetail(`/admin/sales/settlements/${id}/lines/${lineId}/release`, {
    method: 'PATCH',
  })
}

/** GET /admin/sales/settlements/{id}/export ? CSV download */
export async function exportAdminSalesSettlement(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/sales/settlements/${id}/export`, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  })
  if (!res.ok) {
    let detail = `API error: ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="?([^";]+)"?/i)
  const filename = match?.[1]?.trim() || `settlement-${id}.csv`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Subscription payment collection (Admin deposit verification)
// ---------------------------------------------------------------------------

export type AdminPaymentCollectionStatus = {
  collectionMode: string
  collectionModeLabel: string
  message: string
  lastCollectedAt: string | null
  totalRecords: number
  bySource: Record<string, number>
  byStatus: Record<string, number>
  paidOrPartialCount: number
  refundedCount: number
  partialRefundCount: number
  cancelledCount: number
  pgLinked: boolean
}

export type AdminSubscriptionPaymentRecord = {
  id: string
  partnerId: string
  subscriptionId: string
  externalPaymentId: string | null
  idempotencyKey: string
  billingPeriodStart: string
  billingPeriodEnd: string
  paidAt: string
  grossAmount: number
  vatAmount: number
  netAmountExVat: number
  currency: string
  status: string
  refundedAmount: number
  refundedAt: string | null
  paymentProvider: string | null
  source: string
  planTierSnapshot: string | null
  monthlyFeeSnapshot: number | null
  subscriptionStatusSnapshot: string | null
  verifiedByAdminId: string | null
  verifiedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export type AdminSubscriptionPaymentListResponse = {
  items: AdminSubscriptionPaymentRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** GET /admin/subscription-payments/collection-status */
export async function fetchAdminPaymentCollectionStatus(): Promise<AdminPaymentCollectionStatus> {
  return adminFetchDetail('/admin/subscription-payments/collection-status')
}

/** GET /admin/subscription-payments */
export async function fetchAdminSubscriptionPayments(params?: {
  partnerId?: number
  status?: string
  source?: string
  page?: number
  pageSize?: number
}): Promise<AdminSubscriptionPaymentListResponse> {
  return adminFetchDetail(
    `/admin/subscription-payments${salesQs({
      partnerId: params?.partnerId,
      status: params?.status,
      source: params?.source,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

/** POST /admin/subscription-payments/verify */
export async function verifyAdminSubscriptionPayment(body: {
  partnerId: number
  subscriptionId: number
  externalReference: string
  paidAt: string
  billingPeriodStart: string
  billingPeriodEnd: string
  grossAmount: number
  vatAmount: number
  netAmountExVat: number
  paymentMethod?: string | null
  memo?: string | null
  idempotencyKey?: string | null
  confirmWarning: boolean
}): Promise<AdminSubscriptionPaymentRecord> {
  return adminFetchDetail('/admin/subscription-payments/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** POST /admin/subscription-payments/{id}/cancel */
export async function cancelAdminSubscriptionPayment(
  id: string,
  reason: string,
): Promise<AdminSubscriptionPaymentRecord> {
  return adminFetchDetail(`/admin/subscription-payments/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

/** POST /admin/subscription-payments/{id}/refund */
export async function refundAdminSubscriptionPayment(
  id: string,
  body: {
    refundedAmountExVat: number
    partial?: boolean
    refundedAt?: string | null
    reason?: string | null
  },
): Promise<AdminSubscriptionPaymentRecord> {
  return adminFetchDetail(`/admin/subscription-payments/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Platform app members (Admin /admin/users)
// ---------------------------------------------------------------------------

export type AdminAppUserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'

export type AdminAppUserSummary = {
  totalMembers: number
  joinedToday: number
  joinedThisMonth: number
  suspendedCount: number
}

export type AdminAppUserListItem = {
  id: string
  name: string
  phone: string | null
  email: string | null
  loginProvider: string
  joinedAt: string
  lastLoginAt: string | null
  reservationCount: number
  cancelledReservationCount: number
  visitedPartnerCount: number
  lastReservationAt: string | null
  status: AdminAppUserStatus | string
  pushConsent: boolean | null
  marketingConsent: boolean | null
  marketingSmsConsent: boolean | null
  hasPushDevice: boolean
}

export type AdminAppUserListResponse = {
  items: AdminAppUserListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: AdminAppUserSummary
}

export type AdminAppUserDetail = AdminAppUserListItem & {
  adminMemo: string | null
  suspendedAt: string | null
  suspendReason: string | null
  stats: {
    reservationCount: number
    cancelledReservationCount: number
    visitedPartnerCount: number
    lastReservationAt: string | null
  }
  visitedPartners: Array<{
    partnerId: string
    name: string
    slug: string | null
    status: string | null
    reservationCount: number
    lastVisitedAt: string | null
  }>
  coupons: Array<{
    id: string
    name: string
    status: string
    expiresAt: string | null
  }>
}

/** GET /admin/users */
export async function fetchAdminAppUsers(params?: {
  keyword?: string
  status?: string
  joinedFrom?: string
  joinedTo?: string
  page?: number
  pageSize?: number
}): Promise<AdminAppUserListResponse> {
  return adminFetchDetail(
    `/admin/users${salesQs({
      keyword: params?.keyword,
      status: params?.status,
      joinedFrom: params?.joinedFrom,
      joinedTo: params?.joinedTo,
      page: params?.page,
      pageSize: params?.pageSize,
    })}`,
  )
}

/** GET /admin/users/{id} */
export async function fetchAdminAppUser(id: string): Promise<AdminAppUserDetail> {
  return adminFetchDetail(`/admin/users/${id}`)
}

/** PATCH /admin/users/{id}/status */
export async function updateAdminAppUserStatus(
  id: string,
  body: { status: 'ACTIVE' | 'SUSPENDED'; reason?: string | null },
): Promise<AdminAppUserDetail> {
  return adminFetchDetail(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** PATCH /admin/users/{id}/memo */
export async function updateAdminAppUserMemo(
  id: string,
  memo: string | null,
): Promise<AdminAppUserDetail> {
  return adminFetchDetail(`/admin/users/${id}/memo`, {
    method: 'PATCH',
    body: JSON.stringify({ memo }),
  })
}

// ---------------------------------------------------------------------------
// Platform reviews (Admin /admin/reviews)
// ---------------------------------------------------------------------------

export type AdminReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'DELETED'

export type AdminReviewSummary = {
  total: number
  published: number
  hidden: number
  deleted: number
  averageRating: number | null
}

export type AdminReviewAuthor = {
  id: string | null
  name: string
  phone: string | null
  email: string | null
  withdrawn: boolean
}

export type AdminReviewPartner = {
  id: string
  name: string
  slug: string | null
  bizType: string | null
  deleted: boolean
}

export type AdminReviewListItem = {
  id: string
  rating: number
  content: string | null
  author: AdminReviewAuthor
  partner: AdminReviewPartner
  reservationId: string | null
  imageCount: number
  reportCount: number
  status: AdminReviewStatus | string
  createdAt: string
  updatedAt: string | null
}

export type AdminReviewListResult = {
  items: AdminReviewListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: AdminReviewSummary
}

export type AdminReviewDetail = {
  id: string
  rating: number
  content: string | null
  images: string[]
  author: AdminReviewAuthor
  partner: AdminReviewPartner
  reservation: {
    id: string
    bookingNumber: string | null
    bookingDate: string | null
    status: string | null
    serviceName: string | null
    vehicleModel: string | null
    vehicleNumber: string | null
    verifiedVisit: boolean
  } | null
  reply: { content: string | null; repliedAt: string | null }
  reportCount: number
  status: AdminReviewStatus | string
  createdAt: string
  updatedAt: string | null
  moderation: {
    hiddenAt: string | null
    hiddenByAdminId: string | null
    hiddenReason: string | null
  }
}

/** GET /admin/reviews */
export async function fetchAdminReviews(params: {
  keyword?: string
  partnerId?: string
  rating?: number
  status?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}): Promise<AdminReviewListResult> {
  return adminFetchDetail(
    `/admin/reviews${salesQs({
      keyword: params.keyword,
      partnerId: params.partnerId,
      rating: params.rating,
      status: params.status,
      createdFrom: params.createdFrom,
      createdTo: params.createdTo,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
  )
}

/** GET /admin/reviews/{id} */
export async function fetchAdminReview(id: string): Promise<AdminReviewDetail> {
  return adminFetchDetail(`/admin/reviews/${id}`)
}

/** PATCH /admin/reviews/{id}/status */
export async function updateAdminReviewStatus(
  id: string,
  body: { status: 'PUBLISHED' | 'HIDDEN'; reason?: string | null },
): Promise<AdminReviewDetail> {
  return adminFetchDetail(`/admin/reviews/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Review reports (Admin /admin/review-reports)
// ---------------------------------------------------------------------------

export type AdminReviewReportListItem = {
  id: string
  status: string
  reason: string
  reviewId: string
  reviewPreview: string | null
  partnerName: string
  reporterName: string
  authorName: string
  reportCount: number
  createdAt: string
}

export type AdminReviewReportListResult = {
  items: AdminReviewReportListItem[]
  total: number
  page: number
  pageSize: number
}

export type AdminReviewReportDetail = {
  id: string
  status: string
  reason: string
  detail: string | null
  createdAt: string
  processedAt: string | null
  resolutionNote: string | null
  processedByAdminId: string | null
  review: {
    id: string
    rating: number
    content: string | null
    images: string[]
    status: string
    hiddenReason: string | null
    createdAt: string | null
    partnerReply: string | null
  }
  reporter: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
  }
  author: {
    id: string | null
    name: string | null
    phone: string | null
  }
  partner: {
    id: string
    name: string
    slug: string | null
  }
  reportCount: number
  pendingCount: number
}

/** GET /admin/review-reports */
export async function fetchAdminReviewReports(params: {
  status?: string
  reason?: string
  keyword?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}): Promise<AdminReviewReportListResult> {
  return adminFetchDetail(
    `/admin/review-reports${salesQs({
      status: params.status,
      reason: params.reason,
      keyword: params.keyword,
      createdFrom: params.createdFrom,
      createdTo: params.createdTo,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
  )
}

/** GET /admin/review-reports/{id} */
export async function fetchAdminReviewReport(id: string): Promise<AdminReviewReportDetail> {
  return adminFetchDetail(`/admin/review-reports/${id}`)
}

/** PATCH /admin/review-reports/{id}/resolve */
export async function resolveAdminReviewReport(
  id: string,
  body: { resolution: 'DISMISSED' | 'HIDE_REVIEW'; note: string },
): Promise<AdminReviewReportDetail> {
  return adminFetchDetail(`/admin/review-reports/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/** GET /admin/payments */
export async function fetchAdminPartnerPayments(params?: {
  partnerId?: number
  status?: string
  page?: number
  pageSize?: number
}) {
  return adminFetchDetail<{
    items: Array<Record<string, unknown>>
    total: number
    page: number
    pageSize: number
  }>(
    `/admin/payments${salesQs({
      partnerId: params?.partnerId,
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
  )
}

/** POST /admin/payments/{id}/cancel */
export async function cancelAdminPartnerPayment(
  id: number | string,
  body: { cancelAmount?: number; cancelReason?: string },
) {
  return adminFetchDetail(`/admin/payments/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({
      cancelAmount: body.cancelAmount,
      cancelReason: body.cancelReason ?? 'admin cancel',
    }),
  })
}

/** GET /admin/settlements */
export async function fetchAdminPartnerSettlements() {
  return adminFetchDetail<{ items: Array<Record<string, unknown>> }>('/admin/settlements')
}

/** POST /admin/settlements/generate */
export async function generateAdminPartnerSettlement(body: {
  periodStart: string
  periodEnd: string
}) {
  return adminFetchDetail('/admin/settlements/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** POST /admin/settlements/{id}/confirm */
export async function confirmAdminPartnerSettlement(id: number | string) {
  return adminFetchDetail(`/admin/settlements/${id}/confirm`, { method: 'POST' })
}

/** POST /admin/settlements/{id}/request-payout */
export async function requestAdminPartnerPayout(id: number | string) {
  return adminFetchDetail(`/admin/settlements/${id}/request-payout`, { method: 'POST' })
}

/** GET /admin/payment-webhooks */
export async function fetchAdminPaymentWebhooks(page = 1) {
  return adminFetchDetail<{ items: Array<Record<string, unknown>>; total: number }>(
    `/admin/payment-webhooks?page=${page}&pageSize=20`,
  )
}

/** GET /admin/pg-settings-status */
export async function fetchAdminPgSettingsStatus() {
  return adminFetchDetail<Record<string, unknown>>('/admin/pg-settings-status')
}

/** GET /admin/trial-policy */
export async function fetchAdminTrialPolicy() {
  return adminFetchDetail<Record<string, unknown>>('/admin/trial-policy')
}
