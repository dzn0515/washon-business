import { getAccessToken } from '@/lib/api-client'
import { getToken } from '@/lib/auth'
import type {
  PlatformSettings,
  SystemStatus,
  AdminLoginLog,
  BlockedIp,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const isDev = process.env.NODE_ENV !== 'production'

// TODO: 추후 타입 분리 — AdminBusiness, AdminReservation 등 전용 타입 정의
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
  menuName: string
  bookingDate: string
  startTime: string
  status: string
  source: string | null
  vehicle: {
    licensePlate: string
    brand?: string
    model?: string
  } | null
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
    const err = new Error(`API error: ${res.status}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function mapBusinessItem(b: Record<string, unknown>): AdminBusinessListItem {
  return {
    id: String(b.id),
    name: String(b.name ?? b.business_name ?? ''),
    bizType: String(b.biz_type ?? b.bizType ?? b.business_type ?? 'wash'),
    ownerName: String(b.owner_name ?? b.ownerName ?? ''),
    phone: String(b.phone ?? ''),
    status: String(b.status ?? 'pending'),
    plan: b.plan ? String(b.plan) : null,
    slug: b.slug ? String(b.slug) : null,
    createdAt: String(b.created_at ?? b.createdAt ?? '').slice(0, 10),
    lastLogin: b.last_login ? String(b.last_login).slice(0, 10) : null,
    recentReservations: Number(b.recent_reservations ?? b.recentReservations ?? 0),
    recentRevenue: Number(b.recent_revenue ?? b.recentRevenue ?? 0),
    rating: b.rating != null ? Number(b.rating) : null,
  }
}

const MOCK_BUSINESSES: AdminBusinessListItem[] = [
  {
    id: '1',
    name: '반짝반짝 세차장',
    bizType: 'wash',
    ownerName: '김민수',
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
    name: '클린카 디테일링',
    bizType: 'detailing',
    ownerName: '이지영',
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
    name: '타이어킹',
    bizType: 'tire',
    ownerName: '박준호',
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
    businessName: '반짝반짝 세차장',
    customerName: '김민수',
    menuName: '기본세차',
    bookingDate: '2026-06-28',
    startTime: '10:00',
    status: 'confirmed',
    source: 'app',
    vehicle: { licensePlate: '12가3456', brand: 'BMW', model: '520d' },
  },
  {
    id: 'r2',
    businessName: '클린카',
    customerName: '이지영',
    menuName: '실내크리닝',
    bookingDate: '2026-06-28',
    startTime: '11:30',
    status: 'in_progress',
    source: 'qr',
    vehicle: null,
  },
  {
    id: 'r3',
    businessName: '스파클링',
    customerName: '박준호',
    menuName: '광택',
    bookingDate: '2026-06-28',
    startTime: '14:00',
    status: 'pending',
    source: 'app',
    vehicle: { licensePlate: '34나5678', brand: '현대', model: '아반떼' },
  },
]

// ── 기존 (Admin-02) ──────────────────────────────────────────

export async function fetchAdminStats() {
  try {
    return await adminFetch<Record<string, number>>('/admin/stats')
  } catch {
    if (!isDev) throw new Error('통계 조회 실패')
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
    if (!isDev) throw new Error('최근 예약 조회 실패')
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
    const data = await adminFetch<{ businesses: Record<string, unknown>[] }>(
      '/admin/businesses?limit=5&sort=created_at',
    )
    return data.businesses.map(mapBusinessItem)
  } catch {
    if (!isDev) throw new Error('최근 업체 조회 실패')
    return MOCK_BUSINESSES.slice(0, 3)
  }
}

// ── Admin-03 ─────────────────────────────────────────────────

// GET /api/v1/admin/businesses — 실제 존재 (status 필터 지원)
export async function fetchAdminAllBusinesses(params?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<AdminBusinessListItem[]> {
  try {
    const query = new URLSearchParams()
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    const qs = query.toString()
    const data = await adminFetch<{ businesses: Record<string, unknown>[] }>(
      `/admin/businesses${qs ? `?${qs}` : ''}`,
    )
    let list = data.businesses.map(mapBusinessItem)
    if (params?.search) {
      const q = params.search.trim().toLowerCase()
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.ownerName.toLowerCase().includes(q) ||
          b.phone.includes(q),
      )
    }
    return list
  } catch {
    if (!isDev) throw new Error('업체 목록 조회 실패')
    console.warn('[Admin][Dev] fetchAdminAllBusinesses → mock')
    let list = [...MOCK_BUSINESSES]
    if (params?.status && params.status !== 'all') {
      list = list.filter((b) => b.status === params.status)
    }
    if (params?.search) {
      const q = params.search.trim().toLowerCase()
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.ownerName.toLowerCase().includes(q) ||
          b.phone.includes(q),
      )
    }
    return list
  }
}

// TODO: GET /api/v1/admin/businesses/{id} — 백엔드 미구현
export async function fetchAdminBusinessDetail(id: string): Promise<AdminBusinessDetail> {
  try {
    const data = await adminFetch<Record<string, unknown>>(`/admin/businesses/${id}`)
    const base = mapBusinessItem(data)
    return {
      ...base,
      email: String(data.email ?? ''),
      address: String(data.address ?? ''),
      memo: String(data.memo ?? ''),
    }
  } catch {
    if (!isDev) throw new Error('업체 상세 조회 실패')
    console.warn('[Admin][Dev] fetchAdminBusinessDetail → mock')
    const found = MOCK_BUSINESSES.find((b) => b.id === id) ?? MOCK_BUSINESSES[0]
    return {
      ...found,
      id,
      email: 'owner@washon.kr',
      address: '서울 강남구',
      memo: '',
    }
  }
}

// PUT /approve, /reject 실제 존재. PATCH /status 는 미구현 → approve/reject 우선 사용
export async function updateBusinessStatus(
  id: string,
  status: string,
  reason?: string,
): Promise<{ success: boolean }> {
  try {
    if (status === 'active') {
      await adminFetch(`/admin/businesses/${id}/approve`, { method: 'PUT' })
      return { success: true }
    }
    if (status === 'rejected') {
      await adminFetch(`/admin/businesses/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason || '관리자 거절' }),
      })
      return { success: true }
    }
    // TODO: PATCH /api/v1/admin/businesses/{id}/status — suspended 등 미구현
    await adminFetch(`/admin/businesses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return { success: true }
  } catch {
    if (!isDev) throw new Error('상태 변경 실패')
    console.warn('[Admin][Dev] updateBusinessStatus → mock success')
    return { success: true }
  }
}

// TODO: PATCH /api/v1/admin/businesses/{id}/memo — 백엔드 미구현
export async function saveBusinessMemo(id: string, memo: string): Promise<{ success: boolean }> {
  try {
    await adminFetch(`/admin/businesses/${id}/memo`, {
      method: 'PATCH',
      body: JSON.stringify({ memo }),
    })
    return { success: true }
  } catch {
    if (!isDev) throw new Error('메모 저장 실패')
    console.warn('[Admin][Dev] saveBusinessMemo → mock success', { id, memo })
    return { success: true }
  }
}

// TODO: GET /api/v1/admin/reservations — 백엔드 미구현
export async function fetchAdminAllReservations(params?: {
  businessId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}): Promise<AdminReservationItem[]> {
  try {
    const query = new URLSearchParams()
    if (params?.businessId) query.set('business_id', params.businessId)
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    if (params?.dateFrom) query.set('date_from', params.dateFrom)
    if (params?.dateTo) query.set('date_to', params.dateTo)
    if (params?.search) query.set('search', params.search)
    query.set('limit', String(params?.limit ?? 20))
    if (params?.page) query.set('page', String(params.page))

    const data = await adminFetch<unknown>(`/admin/reservations?${query}`)
    const list = Array.isArray(data)
      ? data
      : (data as { reservations?: Record<string, unknown>[] }).reservations ??
        (data as { items?: Record<string, unknown>[] }).items ??
        []
    return list.map(mapReservationItem)
  } catch {
    if (!isDev) throw new Error('예약 목록 조회 실패')
    console.warn('[Admin][Dev] fetchAdminAllReservations → mock')
    let list = [...MOCK_RESERVATIONS]
    if (params?.businessId) {
      list = list.filter((r) => r.businessName.includes(params.businessId!))
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((r) => r.status === params.status)
    }
    if (params?.search) {
      const q = params.search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.businessName.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q),
      )
    }
    return list
  }
}

function mapReservationItem(r: Record<string, unknown>): AdminReservationItem {
  const vehicle = r.vehicle as Record<string, string> | null | undefined
  return {
    id: String(r.id),
    businessName: String(r.businessName ?? r.business_name ?? ''),
    customerName: String(r.customerName ?? r.customer_name ?? ''),
    menuName: String(r.menuName ?? r.menu_name ?? r.menu ?? ''),
    bookingDate: String(r.bookingDate ?? r.booking_date ?? r.date ?? '').slice(0, 10),
    startTime: String(r.startTime ?? r.start_time ?? r.time ?? ''),
    status: String(r.status ?? 'pending'),
    source: r.source ? String(r.source) : null,
    vehicle: vehicle
      ? {
          licensePlate: String(vehicle.licensePlate ?? vehicle.license_plate ?? ''),
          brand: vehicle.brand,
          model: vehicle.model,
        }
      : null,
  }
}

// TODO: POST /api/v1/admin/reservations/{id}/cancel — 백엔드 미구현
export async function forceCancelReservation(
  id: string,
  reason: string,
): Promise<{ success: boolean }> {
  try {
    await adminFetch(`/admin/reservations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    return { success: true }
  } catch {
    if (!isDev) throw new Error('강제취소 실패')
    console.warn('[Admin][Dev] forceCancelReservation → mock success')
    return { success: true }
  }
}

// ── Admin-04 ─────────────────────────────────────────────────

// TODO: 추후 타입 분리 — AdminCSInquiry, AdminNotice 등
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
      read: boolean
      update: boolean
      delete: boolean
      approve: boolean
      download: boolean
    }
  >
}

const MOCK_CS: AdminCSInquiry[] = [
  {
    id: 'cs1',
    type: 'customer',
    title: '예약 취소 환불 문의',
    customerName: '김민수',
    status: 'pending',
    assignee: null,
    createdAt: '2026-06-28T10:00:00',
    content: '어제 예약을 취소했는데 환불이 아직 처리되지 않았습니다.',
    replies: [],
  },
  {
    id: 'cs2',
    type: 'business',
    title: '정산 오류 문의',
    businessName: '반짝반짝 세차장',
    status: 'in_progress',
    assignee: '운영자1',
    createdAt: '2026-06-27T15:30:00',
    content: '6월 정산 금액이 실제 매출과 다릅니다.',
    replies: [
      { content: '확인 중입니다.', createdAt: '2026-06-27T16:00:00', author: '운영자1' },
    ],
  },
  {
    id: 'cs3',
    type: 'report',
    title: '허위 리뷰 신고',
    customerName: '이지영',
    status: 'completed',
    assignee: '운영자2',
    createdAt: '2026-06-26T09:00:00',
    content: '실제 방문하지 않은 고객의 허위 리뷰입니다.',
    replies: [
      { content: '리뷰 삭제 처리 완료했습니다.', createdAt: '2026-06-26T11:00:00', author: '운영자2' },
    ],
  },
]

const MOCK_NOTICES: AdminNotice[] = [
  {
    id: 'n1',
    title: '시스템 점검 안내',
    target: 'all',
    channels: ['push'],
    sendType: 'immediate',
    status: 'sent',
    createdAt: '2026-06-28',
  },
  {
    id: 'n2',
    title: '업체 정산 안내',
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

// TODO: GET /api/v1/admin/cs/inquiries — 백엔드 미구현
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
    if (!isDev) throw new Error('CS 목록 조회 실패')
    console.warn('[Admin][Dev] fetchAdminCSInquiries → mock')
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

// TODO: POST /api/v1/admin/cs/inquiries/{id}/reply — 백엔드 미구현
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
    if (!isDev) throw new Error('답변 등록 실패')
    console.warn('[Admin][Dev] replyAdminCSInquiry → mock')
    return { success: true }
  }
}

// TODO: GET /api/v1/admin/notices — 백엔드 미구현
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
    if (!isDev) throw new Error('공지 목록 조회 실패')
    console.warn('[Admin][Dev] fetchAdminNotices → mock')
    return MOCK_NOTICES
  }
}

// TODO: POST /api/v1/admin/notices — 백엔드 미구현
export async function sendAdminNotice(data: NoticePayload): Promise<{ success: boolean; id?: string }> {
  try {
    const res = await adminFetch<{ id?: string }>('/admin/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { success: true, id: res?.id }
  } catch {
    if (!isDev) throw new Error('공지 발송 실패')
    console.warn('[Admin][Dev] sendAdminNotice → mock')
    return { success: true, id: 'mock-notice-1' }
  }
}

// TODO: POST /api/v1/admin/roles/{role}/permissions — 백엔드 미구현
export async function saveRolePermissions(data: RolePermissions): Promise<{ success: boolean }> {
  try {
    await adminFetch(`/admin/roles/${data.role}/permissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { success: true }
  } catch (e) {
    if (!isDev) {
      const err = e as Error & { status?: number }
      if (err.status === 404 || err.status === 405) {
        throw new Error('권한 저장 API가 연결되지 않았습니다.')
      }
      throw new Error('권한 저장에 실패했습니다.')
    }
    console.warn('[Admin][Dev] saveRolePermissions → mock')
    return { success: true }
  }
}

// ── Admin-05 ─────────────────────────────────────────────────

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
    reason: '비정상 로그인 시도',
    blockedAt: '2026-06-26T10:00:00Z',
    blockedBy: 'admin@washon.kr',
  },
]

// TODO: GET /api/v1/admin/settings/platform — 백엔드 미구현
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  try {
    return await adminFetch<PlatformSettings>('/admin/settings/platform')
  } catch {
    if (!isDev) throw new Error('운영설정 조회 실패')
    console.warn('[Admin][Dev] fetchPlatformSettings → mock')
    return { ...MOCK_PLATFORM_SETTINGS }
  }
}

// TODO: PATCH /api/v1/admin/settings/platform — 백엔드 미구현
export async function savePlatformSettings(data: Partial<PlatformSettings>): Promise<void> {
  try {
    await adminFetch('/admin/settings/platform', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch {
    if (!isDev) throw new Error('운영설정 저장 실패')
    console.warn('[Admin][Dev] savePlatformSettings → mock', data)
  }
}

// TODO: GET /api/v1/admin/system/status — 백엔드 미구현
export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    return await adminFetch<SystemStatus>('/admin/system/status')
  } catch {
    if (!isDev) throw new Error('시스템 상태 API 미연결')
    console.warn('[Admin][Dev] fetchSystemStatus → mock')
    return { ...MOCK_SYSTEM_STATUS }
  }
}

// TODO: GET /api/v1/admin/security/login-logs — 백엔드 미구현
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
    if (!isDev) throw new Error('로그인 이력 조회 실패')
    console.warn('[Admin][Dev] fetchAdminLoginLogs → mock')
    return MOCK_LOGIN_LOGS
  }
}

// TODO: GET /api/v1/admin/security/blocked-ips — 백엔드 미구현
export async function fetchBlockedIps(): Promise<BlockedIp[]> {
  try {
    const data = await adminFetch<unknown>('/admin/security/blocked-ips')
    return parseList<BlockedIp>(data, ['ips', 'items'])
  } catch {
    if (!isDev) throw new Error('차단 IP 목록 조회 실패')
    console.warn('[Admin][Dev] fetchBlockedIps → mock')
    return [...mockBlockedIps]
  }
}

// TODO: POST /api/v1/admin/security/blocked-ips — 백엔드 미구현 (목록 저장만, 실제 차단 미적용)
export async function blockIp(ip: string, reason: string): Promise<void> {
  try {
    await adminFetch('/admin/security/blocked-ips', {
      method: 'POST',
      body: JSON.stringify({ ip, reason }),
    })
  } catch {
    if (!isDev) throw new Error('IP 차단 저장 실패')
    console.warn('[Admin][Dev] blockIp → mock', { ip, reason })
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

// TODO: DELETE /api/v1/admin/security/blocked-ips — 백엔드 미구현
export async function unblockIp(ip: string): Promise<void> {
  try {
    await adminFetch('/admin/security/blocked-ips', {
      method: 'DELETE',
      body: JSON.stringify({ ip }),
    })
  } catch {
    if (!isDev) throw new Error('IP 차단 해제 실패')
    console.warn('[Admin][Dev] unblockIp → mock', ip)
    mockBlockedIps = mockBlockedIps.filter((b) => b.ip !== ip)
  }
}
