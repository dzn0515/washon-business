'use client'

import { memo, type ReactNode } from 'react'

type AutomationSettingCardProps = {
  title: string
  description?: string
  children: ReactNode
  error?: string | null
}

function AutomationSettingCardInner({
  title,
  description,
  children,
  error,
}: AutomationSettingCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {description ? <p className="mt-1 text-xs text-gray-400">{description}</p> : null}
      <div className="mt-3">{children}</div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

const AutomationSettingCard = memo(AutomationSettingCardInner)
AutomationSettingCard.displayName = 'AutomationSettingCard'

export default AutomationSettingCard
