import { AuthRequiredError, clearAuthSession, getAccessToken, ensureLoggedIn } from '@/lib/api-client'
import { DemoModeError, isDemoMode } from '@/lib/demo-mode'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export type BusinessReviewStats = {
  total: number
  averageRating: number | null
  unreplied: number
  thisMonth: number
}

export type BusinessReviewListItem = {
  id: string
  rating: number
  content: string | null
  contentPreview: string | null
  imageUrls: string[]
  authorName: string
  status: string
  createdAt: string
  partnerReply: string | null
  repliedAt: string | null
  hasReply: boolean
}

export type BusinessReviewListResponse = {
  items: BusinessReviewListItem[]
  total: number
  page: number
  pageSize: number
  stats: BusinessReviewStats
}

export type BusinessReviewReservationSummary = {
  id: string
  serviceName: string | null
  bookingDate: string | null
  vehicleModel: string | null
}

export type BusinessReviewDetail = {
  id: string
  rating: number
  content: string | null
  imageUrls: string[]
  authorName: string
  status: string
  statusLabel: string
  createdAt: string
  partnerReply: string | null
  repliedAt: string | null
  replyUpdatedAt: string | null
  canReply: boolean
  reservation: BusinessReviewReservationSummary | null
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

async function reviewFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (isDemoMode()) throw new DemoModeError()
  if (!ensureLoggedIn()) throw new AuthRequiredError()
  const token = getAccessToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
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
    throw new Error(detail)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function fetchBusinessReviews(params: {
  keyword?: string
  rating?: number
  replied?: boolean
  status?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}): Promise<BusinessReviewListResponse> {
  return reviewFetch<BusinessReviewListResponse>(
    `/business/reviews${buildQuery({
      keyword: params.keyword,
      rating: params.rating,
      replied: params.replied,
      status: params.status,
      createdFrom: params.createdFrom,
      createdTo: params.createdTo,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })}`,
  )
}

export async function fetchBusinessReview(id: string): Promise<BusinessReviewDetail> {
  return reviewFetch<BusinessReviewDetail>(`/business/reviews/${id}`)
}

export async function createBusinessReviewReply(
  id: string,
  content: string,
): Promise<BusinessReviewDetail> {
  return reviewFetch<BusinessReviewDetail>(`/business/reviews/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function updateBusinessReviewReply(
  id: string,
  content: string,
): Promise<BusinessReviewDetail> {
  return reviewFetch<BusinessReviewDetail>(`/business/reviews/${id}/reply`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function deleteBusinessReviewReply(id: string): Promise<BusinessReviewDetail> {
  return reviewFetch<BusinessReviewDetail>(`/business/reviews/${id}/reply`, {
    method: 'DELETE',
  })
}
