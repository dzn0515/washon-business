'use client'

import { Pencil, Trash2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { CARD } from '@/lib/dashboard-ui'
import type { MenuCardDisplay } from '@/lib/menu-display'

type Props = {
  display: MenuCardDisplay
  isActive: boolean
  isPopular?: boolean
  onEdit: () => void
  onDelete?: () => void
  onToggle?: () => void
  showToggle?: boolean
}

export default function MenuListCard({
  display,
  isActive,
  isPopular,
  onEdit,
  onDelete,
  onToggle,
  showToggle,
}: Props) {
  return (
    <div className={`${CARD} ${!isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-blue-50 text-blue-700 border border-blue-100">
              {display.categoryBadge}
            </Badge>
            {!isActive ? <Badge className="bg-gray-100 text-gray-500">비활성</Badge> : null}
            {isPopular ? <Badge className="bg-orange-100 text-orange-700">인기</Badge> : null}
          </div>

          <div className="space-y-0.5">
            {display.titleLines.map((line) => (
              <p key={line} className="font-semibold text-gray-900 text-[15px] leading-snug">
                {line}
              </p>
            ))}
            {display.detailLines.map((line) => (
              <p key={line} className="text-xs text-gray-500">
                {line}
              </p>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">{display.durationLabel}</p>
            <p className="text-sm font-semibold text-gray-900 text-right shrink-0">
              {display.priceLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="수정"
          >
            <Pencil size={14} />
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label="삭제"
            >
              <Trash2 size={14} />
            </button>
          ) : null}
          {showToggle && onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className={`text-[10px] px-2 py-1 rounded-lg border ${
                isActive ? 'border-gray-200 text-gray-500' : 'border-blue-200 text-blue-600 bg-blue-50'
              }`}
            >
              {isActive ? 'OFF' : 'ON'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
