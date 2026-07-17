'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { CARD } from '@/lib/dashboard-ui'

export default function DashboardSection({
  title,
  actionHref,
  actionLabel,
  children,
  className = '',
}: {
  title: string
  actionHref?: string
  actionLabel?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${CARD} ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {actionLabel}
            <ChevronRight size={14} aria-hidden />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}
