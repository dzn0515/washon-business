const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const TOKEN_KEY = 'washon_access_token'

let accessToken: string | null = null

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
  if (!res.ok) throw new Error(data.detail ?? `Login failed: ${res.status}`)
  setAccessToken(data.access_token)
  return data
}

export async function ensureLoggedIn(): Promise<void> {
  if (getAccessToken()) return
  await login('owner@washon.kr', 'washon1234')
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  if (!getAccessToken()) await ensureLoggedIn()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    setAccessToken(null)
    await ensureLoggedIn()
    return apiFetch<T>(path, options)
  }

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
