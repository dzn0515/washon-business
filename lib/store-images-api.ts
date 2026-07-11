import { AuthRequiredError, clearAuthSession, getAccessToken, ensureLoggedIn } from '@/lib/api-client'
import { DemoModeError, isDemoMode } from '@/lib/demo-mode'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export type GalleryImage = {
  id: number
  imageUrl: string
  caption: string
  sortOrder: number
  isActive?: boolean
  createdAt?: string | null
}

export type StoreImages = {
  logoUrl: string
  bannerUrl: string
  gallery: GalleryImage[]
}

export type ImageUploadKind = 'logo' | 'banner' | 'gallery'

export type ImageUploadResult = {
  kind: string
  url: string
  partnerId: number
  id?: number | null
  caption?: string
  sortOrder?: number | null
}

export type PartnerDocument = {
  id: number
  documentType: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  uploadedAt?: string | null
  reviewedAt?: string | null
}

async function uploadFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

export async function fetchStoreImages(): Promise<StoreImages> {
  return uploadFetch<StoreImages>('/business/store/images')
}

export async function uploadStoreImage(
  kind: ImageUploadKind,
  file: File,
  caption?: string,
): Promise<ImageUploadResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('kind', kind)
  if (caption) form.append('caption', caption)
  return uploadFetch<ImageUploadResult>('/business/uploads/image', {
    method: 'POST',
    body: form,
  })
}

export async function deleteGalleryImage(imageId: number): Promise<void> {
  await uploadFetch(`/business/store/images/${imageId}`, { method: 'DELETE' })
}

export async function reorderGalleryImages(orderedIds: number[]): Promise<GalleryImage[]> {
  const data = await uploadFetch<{ items: GalleryImage[] }>('/business/store/images/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  })
  return data.items ?? []
}

export async function fetchMyDocuments(): Promise<PartnerDocument[]> {
  const data = await uploadFetch<{ items: PartnerDocument[] }>('/business/documents')
  return data.items ?? []
}

export async function uploadBusinessRegistration(file: File): Promise<PartnerDocument> {
  const form = new FormData()
  form.append('file', file)
  const data = await uploadFetch<{ document: PartnerDocument }>(
    '/business/documents/business-registration',
    { method: 'POST', body: form },
  )
  return data.document
}
