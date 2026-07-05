'use client'

import { Menu } from 'lucide-react'
import Badge from '@/components/ui/Badge'

interface DemoHeaderProps {
  title: string
  onMenuClick?: () => void
}

export default function DemoHeader({ title, onMenuClick }: DemoHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200"
        aria-label="메뉴"
      >
        <Menu size={18} />
      </button>
      <h1 className="flex-1 text-[15px] font-semibold text-gray-900 truncate">{title}</h1>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge className="bg-gray-100 text-gray-600 text-[11px]">읽기 전용</Badge>
        <Badge className="bg-amber-100 text-amber-800 text-[11px]">데모</Badge>
      </div>
    </header>
  )
}
