import type { AdApplicationStatus, AdminAdApplication } from './types'
import { AD_APPLICATION_STATUS_LABEL } from './types'
import type { AdBillingType } from '@/lib/billing/catalog'
import type { BusinessProductDisplayStatus } from './types'

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDisplayDate(d: string | null | undefined): string {
  return d ? d.replace(/-/g, '.') : '-'
}

export function resolveStatusOnApprove(startDate: string, today = todayIso()): AdApplicationStatus {
  return startDate <= today ? 'ACTIVE' : 'APPROVED'
}

export function createHistoryEntry(
  status: AdApplicationStatus,
  note: string,
  by: 'admin' | 'system' = 'admin',
): AdminAdApplication['statusHistory'][number] {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status,
    changedAt: new Date().toISOString(),
    note,
    by,
  }
}

export function remainingPeriodLabel(
  status: AdApplicationStatus,
  startDate: string | null,
  endDate: string | null,
  today = todayIso(),
): string {
  if (status === 'REJECTED' || status === 'PENDING_REVIEW') return '-'
  if (status === 'ENDED') return '종료됨'
  if (!endDate) return '-'

  if (status === 'APPROVED' && startDate && startDate > today) {
    const daysUntil = daysBetween(today, startDate)
    return `시작 D-${daysUntil}`
  }

  const remaining = daysBetween(today, endDate)
  if (remaining < 0) return '종료됨'
  if (remaining === 0) return '오늘 종료'
  return `${remaining}일 남음`
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from)
  const b = new Date(to)
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function productCardStatusLabel(
  status: BusinessProductDisplayStatus,
  billingType: AdBillingType,
): string {
  if (status === 'active') {
    return billingType === 'monthly' ? '이용중' : '진행중'
  }
  const labels: Record<Exclude<BusinessProductDisplayStatus, 'active'>, string> = {
    available: '신청 가능',
    pending: '신청 대기',
    approved: '승인',
    ended: '재신청 가능',
  }
  return labels[status as Exclude<BusinessProductDisplayStatus, 'active'>] ?? status
}

export function historyStatusLabel(status: AdApplicationStatus): string {
  return AD_APPLICATION_STATUS_LABEL[status]
}
