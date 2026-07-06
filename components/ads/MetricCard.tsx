'use client'

import { memo } from 'react'

type MetricCardProps = {
  label: string
  value: string
  tone?: 'default' | 'warning' | 'success'
}

const TONE_CLASS = {
  default: 'text-gray-900',
  warning: 'text-amber-700',
  success: 'text-green-700',
} as const

function MetricCardInner({ label, value, tone = 'default' }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <p className="text-[12px] font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${TONE_CLASS[tone]}`}>{value}</p>
    </div>
  )
}

const MetricCard = memo(MetricCardInner)
MetricCard.displayName = 'MetricCard'

export default MetricCard
