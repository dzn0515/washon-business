'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

type Tone = 'blue' | 'orange' | 'emerald' | 'violet' | 'sky' | 'slate'

const TONE: Record<Tone, { iconBg: string; iconText: string }> = {
  blue: { iconBg: 'bg-blue-50', iconText: 'text-blue-600' },
  orange: { iconBg: 'bg-orange-50', iconText: 'text-orange-600' },
  emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
  violet: { iconBg: 'bg-violet-50', iconText: 'text-violet-600' },
  sky: { iconBg: 'bg-sky-50', iconText: 'text-sky-600' },
  slate: { iconBg: 'bg-slate-100', iconText: 'text-slate-600' },
}

export type DashboardMetricCardProps = {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: Tone
  href?: string
  loading?: boolean
}

export default function DashboardMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'blue',
  href,
  loading,
}: DashboardMetricCardProps) {
  const t = TONE[tone]
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium text-gray-500">{label}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${t.iconBg}`}>
          <Icon size={16} className={t.iconText} aria-hidden />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-7 w-20 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
      )}
      {hint ? <p className="mt-1 text-[11px] text-gray-400">{hint}</p> : null}
    </>
  )

  const className =
    'block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors'

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} hover:border-blue-200 hover:bg-blue-50/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`}
        aria-label={`${label} ${value}`}
      >
        {body}
      </Link>
    )
  }

  return (
    <div className={className} aria-label={`${label} ${value}`}>
      {body}
    </div>
  )
}
