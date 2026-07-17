'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

export default function DashboardEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionHref,
  actionLabel,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-gray-400">
        <Icon size={20} aria-hidden />
      </span>
      <p className="text-sm font-medium text-gray-800">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-xs text-gray-500 leading-relaxed">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
