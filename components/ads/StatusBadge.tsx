'use client'

import { memo } from 'react'
import type { BusinessProductDisplayStatus } from '@/lib/ad-applications/types'
import type { AdBillingType } from '@/lib/billing/catalog'
import { productCardStatusLabel } from '@/lib/ad-applications/utils'

const STATUS_STYLE: Record<BusinessProductDisplayStatus, string> = {
  available: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  ended: 'bg-gray-100 text-gray-400',
}

type StatusBadgeProps = {
  status: BusinessProductDisplayStatus
  billingType: AdBillingType
}

function StatusBadgeInner({ status, billingType }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[status]}`}
    >
      {productCardStatusLabel(status, billingType)}
    </span>
  )
}

const StatusBadge = memo(StatusBadgeInner)
StatusBadge.displayName = 'StatusBadge'

export default StatusBadge
