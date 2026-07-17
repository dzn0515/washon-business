import { getAccessToken, clearAuthSession, AuthRequiredError, ensureLoggedIn } from '@/lib/api-client'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.autoon.kr/api/v1'

async function complianceFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!ensureLoggedIn()) throw new AuthRequiredError()
  const token = getAccessToken()
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  }
  // Do not force JSON Content-Type — FormData needs browser boundary.
  if (options?.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
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

export type ComplianceChecklistItem = {
  id: string
  code: string
  name: string
  description: string | null
  isRequired: boolean
  requiresExpirationDate: boolean
  effectiveStatus: string
  document: {
    id: string
    status: string
    originalFilename: string | null
    rejectionReason: string | null
    expirationDate: string | null
    createdAt: string | null
  } | null
}

export type ComplianceStatus = {
  partnerId: string
  partnerName: string
  businessEntityType: string
  onboardingStatus: string
  contractStatus: string
  pgReadinessStatus: string
  settlementVerificationStatus: string
  legalBusinessName: string | null
  representativeName: string | null
  businessRegistrationNumber: string | null
  settlementBankCode: string | null
  settlementAccountNumberMasked: string | null
  settlementAccountHolder: string | null
  rejectionReason: string | null
  completionRate: number
  canSubmit: boolean
  canApproveAll?: boolean
  checklist: ComplianceChecklistItem[]
  missingRequiredCount: number
  rejectedCount: number
}

export async function fetchBusinessCompliance(): Promise<ComplianceStatus> {
  return complianceFetch('/business/compliance')
}

export async function patchBusinessComplianceProfile(body: Record<string, unknown>) {
  return complianceFetch<ComplianceStatus>('/business/compliance/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function uploadBusinessComplianceDocument(params: {
  documentTypeCode: string
  file: File
  expirationDate?: string
}) {
  const fd = new FormData()
  fd.append('documentTypeCode', params.documentTypeCode)
  fd.append('file', params.file)
  if (params.expirationDate) fd.append('expirationDate', params.expirationDate)
  return complianceFetch('/business/compliance/documents', { method: 'POST', body: fd })
}

export async function submitBusinessCompliance(body: {
  agreeTerms: boolean
  agreePrivacy: boolean
  agreeSettlement: boolean
}) {
  return complianceFetch<ComplianceStatus>('/business/compliance/submit', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function resubmitBusinessCompliance(body: {
  agreeTerms: boolean
  agreePrivacy: boolean
  agreeSettlement: boolean
}) {
  return complianceFetch<ComplianceStatus>('/business/compliance/resubmit', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchOwnerDocumentDownloadUrl(id: string) {
  return complianceFetch<{ url: string; expiresIn: number }>(
    `/business/compliance/documents/${id}/download-url`,
  )
}

export async function listAdminCompliance(params?: {
  q?: string
  onboardingStatus?: string
  page?: number
}) {
  const sp = new URLSearchParams()
  if (params?.q) sp.set('q', params.q)
  if (params?.onboardingStatus) sp.set('onboardingStatus', params.onboardingStatus)
  sp.set('page', String(params?.page ?? 1))
  sp.set('pageSize', '20')
  return complianceFetch<{ items: Array<Record<string, unknown>>; total: number; page: number }>(
    `/admin/partner-compliance?${sp}`,
  )
}

export async function fetchAdminCompliance(partnerId: string) {
  return complianceFetch<ComplianceStatus>(`/admin/partner-compliance/${partnerId}`)
}

export async function adminApproveCompliance(partnerId: string) {
  return complianceFetch(`/admin/partner-compliance/${partnerId}/approve`, { method: 'POST' })
}

export async function adminRejectCompliance(partnerId: string, reason: string) {
  return complianceFetch(`/admin/partner-compliance/${partnerId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function adminRequestRevision(partnerId: string, reason: string) {
  return complianceFetch(`/admin/partner-compliance/${partnerId}/request-revision`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function adminApproveDocument(documentId: string) {
  return complianceFetch(`/admin/partner-compliance-documents/${documentId}/approve`, {
    method: 'POST',
  })
}

export async function adminRejectDocument(documentId: string, reason: string) {
  return complianceFetch(`/admin/partner-compliance-documents/${documentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function adminDocumentDownloadUrl(documentId: string) {
  return complianceFetch<{ url: string; expiresIn: number }>(
    `/admin/partner-compliance-documents/${documentId}/download-url`,
  )
}

export async function listAdminDocumentTypes() {
  return complianceFetch<Array<Record<string, unknown>>>('/admin/partner-document-types')
}

export async function patchAdminDocumentType(id: string, body: Record<string, unknown>) {
  return complianceFetch(`/admin/partner-document-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
