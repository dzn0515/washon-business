import { getAccessToken, clearAuthSession, AuthRequiredError, ensureLoggedIn } from '@/lib/api-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.autoon.kr/api/v1'

async function supportFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!ensureLoggedIn()) throw new AuthRequiredError()
  const token = getAccessToken()
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  }
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

export type SupportTicketListItem = {
  id: string
  ticketNo: string
  channel: string
  categoryName?: string
  status: string
  priority: string
  subject: string
  assignee?: string | null
  partnerName?: string | null
  lastMessageAt?: string | null
  createdAt?: string | null
  waitingReply?: boolean
}

export type SupportMessage = {
  id: string
  senderType: string
  messageType: string
  message: string
  createdAt?: string | null
  attachments?: Array<{
    id: string
    originalFilename: string
    mimeType: string
    downloadUrl?: string
  }>
}

export type SupportTicketDetail = SupportTicketListItem & {
  canMessage?: boolean
  messages: SupportMessage[]
  categoryId?: string
}

export async function fetchSupportCategories() {
  return supportFetch<Array<{ id: string; code: string; name: string }>>('/support/categories')
}

export async function fetchSupportFaqs() {
  return supportFetch<Array<Record<string, unknown>>>('/support/faqs')
}

export async function fetchSupportNotices() {
  return supportFetch<Array<Record<string, unknown>>>('/support/notices')
}

export async function fetchMyTickets() {
  return supportFetch<{ items: SupportTicketListItem[]; total: number }>('/support/tickets')
}

export async function fetchMyTicket(ticketNo: string) {
  return supportFetch<SupportTicketDetail>(`/support/tickets/${ticketNo}`)
}

export async function createSupportTicket(input: {
  categoryId: string
  subject: string
  message: string
  files?: File[]
}) {
  const fd = new FormData()
  fd.set('categoryId', input.categoryId)
  fd.set('subject', input.subject)
  fd.set('message', input.message)
  for (const f of input.files || []) fd.append('files', f)
  return supportFetch<SupportTicketDetail>('/support/tickets', { method: 'POST', body: fd })
}

export async function replyMyTicket(ticketNo: string, message: string, files?: File[]) {
  const fd = new FormData()
  fd.set('message', message)
  for (const f of files || []) fd.append('files', f)
  return supportFetch<SupportTicketDetail>(`/support/tickets/${ticketNo}/messages`, {
    method: 'POST',
    body: fd,
  })
}

export async function adminFetchTickets(params?: Record<string, string | boolean | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === '' || v === false) return
    sp.set(k, String(v))
  })
  return supportFetch<{
    items: SupportTicketListItem[]
    total: number
    kpi: Record<string, number>
  }>(`/admin/support/tickets?${sp}`)
}

export async function adminFetchTicket(id: string) {
  return supportFetch<SupportTicketDetail>(`/admin/support/tickets/${id}`)
}

export async function adminReplyTicket(
  id: string,
  message: string,
  messageType: 'PUBLIC_REPLY' | 'INTERNAL_NOTE' = 'PUBLIC_REPLY',
) {
  const fd = new FormData()
  fd.set('message', message)
  fd.set('messageType', messageType)
  return supportFetch<SupportTicketDetail>(`/admin/support/tickets/${id}/messages`, {
    method: 'POST',
    body: fd,
  })
}

export async function adminAssignTicket(id: string) {
  return supportFetch<SupportTicketDetail>(`/admin/support/tickets/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function adminResolveTicket(id: string) {
  return supportFetch<SupportTicketDetail>(`/admin/support/tickets/${id}/resolve`, {
    method: 'POST',
  })
}

export async function adminCloseTicket(id: string) {
  return supportFetch<SupportTicketDetail>(`/admin/support/tickets/${id}/close`, {
    method: 'POST',
  })
}

export async function adminPatchTicket(id: string, body: { priority?: string; status?: string }) {
  return supportFetch<SupportTicketDetail>(`/admin/support/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function adminFetchFaqs() {
  return supportFetch<Array<Record<string, unknown>>>('/admin/support/faqs')
}

export async function adminSaveFaq(body: Record<string, unknown>, id?: string) {
  if (id) {
    return supportFetch(`/admin/support/faqs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }
  return supportFetch('/admin/support/faqs', { method: 'POST', body: JSON.stringify(body) })
}

export async function adminDeleteFaq(id: string) {
  return supportFetch(`/admin/support/faqs/${id}`, { method: 'DELETE' })
}

export async function adminFetchNotices() {
  return supportFetch<Array<Record<string, unknown>>>('/admin/support/notices')
}

export async function adminSaveNotice(body: Record<string, unknown>, id?: string) {
  if (id) {
    return supportFetch(`/admin/support/notices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }
  return supportFetch('/admin/support/notices', { method: 'POST', body: JSON.stringify(body) })
}

export async function adminPublishNotice(id: string) {
  return supportFetch(`/admin/support/notices/${id}/publish`, { method: 'POST' })
}

export async function adminSendExpoPush(body: {
  title: string
  body: string
  noticeId?: number
  deepLink?: string
  userIds?: number[]
  audience?: string
}) {
  return supportFetch<Record<string, unknown>>('/admin/support/push', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function adminEndNotice(id: string) {
  return supportFetch(`/admin/support/notices/${id}/end`, { method: 'POST' })
}

export async function adminFetchCategories() {
  return supportFetch<Array<{ id: string; code: string; name: string }>>(
    '/admin/support/categories',
  )
}
