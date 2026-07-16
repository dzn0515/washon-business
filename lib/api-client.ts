import { DemoModeError, isDemoMode } from '@/lib/demo-mode'
import { PORTAL_STORAGE_KEY, setStoredPortal } from '@/lib/portal'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const TOKEN_KEY = 'washon_access_token'
const USER_EMAIL_KEY = 'washon_user_email'
const ROLE_KEY = 'washon_mock_role'
const ADMIN_USER_KEY = 'washon_admin_user'
const LEGACY_TOKEN_KEY = 'access_token'
const AUTH_COOKIE = 'washon_access_token'
const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7

let accessToken: string | null = null

function setAuthCookie(token: string | null): void {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  if (!token) {
    document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
    return
  }
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`
}

export class AuthRequiredError extends Error {
  status = 401

  constructor() {
    super('로그인이 필요합니다.')
    this.name = 'AuthRequiredError'
  }
}

export function restoreTokenFromSession(): void {
  if (typeof window === 'undefined') return
  accessToken = sessionStorage.getItem(TOKEN_KEY)
  if (accessToken) setAuthCookie(accessToken)
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (typeof window === 'undefined') return
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
    setAuthCookie(token)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
    setAuthCookie(null)
  }
}

export function setUserEmail(email: string | null): void {
  if (typeof window === 'undefined') return
  if (email) sessionStorage.setItem(USER_EMAIL_KEY, email)
  else sessionStorage.removeItem(USER_EMAIL_KEY)
}

export function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(USER_EMAIL_KEY)
}

export function isAdminUser(): boolean {
  const email = getUserEmail()
  return !!email && email.includes('admin@')
}

export function getAccessToken(): string | null {
  if (!accessToken) restoreTokenFromSession()
  return accessToken
}

export async function login(email: string, password: string): Promise<{
  access_token: string
  refresh_token: string
  token_type: string
  portal: string
  role: string
  passwordResetRequired: boolean
}> {
  const normalizedEmail = email.trim().toLowerCase()
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : `Login failed: ${res.status}`
    const err = new Error(detail) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  setAccessToken(data.access_token)
  setUserEmail(normalizedEmail)
  return data
}

export type AuthMe = {
  id: string | number
  role: string
  email: string
  name?: string | null
}

export async function fetchAuthMe(): Promise<AuthMe> {
  return apiFetch<AuthMe>('/auth/me')
}

export function clearAuthSession(): void {
  accessToken = null
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_EMAIL_KEY)
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(ADMIN_USER_KEY)
  sessionStorage.removeItem(PORTAL_STORAGE_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  setAuthCookie(null)
  setStoredPortal(null)
}

export type RegisterPayload = {
  email: string
  password: string
  name: string
  phone: string
  business_name: string
  biz_type: string
  business_number?: string | null
  address: string
  zipcode?: string
  road_address?: string
  jibun_address?: string
  detail_address?: string
  phone_business: string
  bay_count: number
  business_category?: string
}

function formatRegisterErrorDetail(detail: unknown, status: number): string {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg?: string }).msg || '')
        }
        return ''
      })
      .filter(Boolean)
    if (parts.length > 0) return parts.join('\n')
  }
  if (detail && typeof detail === 'object' && 'message' in detail) {
    const message = String((detail as { message?: string }).message || '')
    if (message) return message
  }
  return `입점 신청에 실패했습니다. (${status})`
}

export async function register(payload: RegisterPayload) {
  const body: Record<string, unknown> = { ...payload }
  if (body.business_number == null || body.business_number === '') {
    delete body.business_number
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(formatRegisterErrorDetail((data as { detail?: unknown }).detail, res.status))
  }
  return data as {
    id: string
    email: string
    name: string
    status: string
    message: string
  }
}

export type AdminBusiness = {
  id: string
  business_name: string
  owner_name: string
  email: string | null
  phone: string | null
  business_number: string | null
  address: string
  status: string
  rejection_reason?: string | null
  created_at: string
}

export async function fetchAdminBusinesses(status?: string) {
  const q = status ? `?status=${status}` : ''
  const data = await apiFetch<{ businesses: AdminBusiness[] }>(`/admin/businesses${q}`)
  return data.businesses
}

export async function approveBusiness(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/admin/businesses/${id}/approve`, {
    method: 'PUT',
  })
}

export async function rejectBusiness(id: string, reason: string) {
  return apiFetch<{ success: boolean; message: string }>(`/admin/businesses/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  })
}

export function ensureLoggedIn(): boolean {
  return !!getAccessToken()
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  if (isDemoMode()) throw new DemoModeError()

  if (!ensureLoggedIn()) throw new AuthRequiredError()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    clearAuthSession()
    throw new AuthRequiredError()
  }

  if (!res.ok) {
    let detail = `API error: ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
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
