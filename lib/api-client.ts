const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const TOKEN_KEY = 'washon_access_token'
const USER_EMAIL_KEY = 'washon_user_email'
const ROLE_KEY = 'washon_mock_role'
const ADMIN_USER_KEY = 'washon_admin_user'
const LEGACY_TOKEN_KEY = 'access_token'

let accessToken: string | null = null

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
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (typeof window === 'undefined') return
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
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

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : `Login failed: ${res.status}`
    const err = new Error(detail) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  setAccessToken(data.access_token)
  setUserEmail(email)
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
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export type RegisterPayload = {
  email: string
  password: string
  name: string
  phone: string
  business_name: string
  biz_type: string
  business_number: string
  address: string
  phone_business: string
  bay_count: number
  business_category?: string
}

export async function register(payload: RegisterPayload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : `Register failed: ${res.status}`
    throw new Error(detail)
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
