'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'
import { won } from '@/lib/dashboard-ui'
import type { ApiCustomer } from '@/lib/customers-api'

function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return null
  return `···${digits.slice(-4)}`
}

function formatVisit(iso: string | null): string {
  if (!iso) return '방문 기록 없음'
  return iso.slice(0, 10)
}

export default function RecentCustomerList({
  customers,
  loading,
  error,
  href,
  onRetry,
}: {
  customers: ApiCustomer[]
  loading: boolean
  error: string | null
  href: (path: string) => string
  onRetry?: () => void
}) {
  if (loading) return <DashboardSkeleton rows={4} />

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-red-600">최근 고객을 불러오지 못했습니다.</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-xs font-medium text-blue-600"
          >
            다시 시도
          </button>
        ) : null}
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <DashboardEmptyState
        icon={Users}
        title="아직 등록된 고객이 없습니다"
        description="첫 고객을 등록하고 방문 이력을 관리해보세요."
        actionHref={href('/dashboard/customers')}
        actionLabel="고객 관리로 이동"
      />
    )
  }

  return (
    <ul className="divide-y divide-gray-50">
      {customers.map((c) => {
        const id = c.id || c.customerId || ''
        const phone = maskPhone(c.phone)
        return (
          <li key={id}>
            <Link
              href={href(`/dashboard/customers/${id}`)}
              className="flex items-center justify-between gap-3 py-2.5 -mx-1 px-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {c.name?.trim() || '이름 없음'}
                  {phone ? (
                    <span className="ml-1.5 text-xs font-normal text-gray-400">{phone}</span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {[c.vehicle_model, formatVisit(c.last_visit_at), `방문 ${c.visit_count}회`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-gray-700">{won(c.total_spent)}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
