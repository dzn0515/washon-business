'use client'
import { Menu, LogOut } from 'lucide-react'
import NotificationBell from '@/components/layout/NotificationBell'
import Badge from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { logout } = useAuthStore()
  const router = useRouter()
  const { isDemo } = useDemoMode()

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
      {isDemo ? (
        <Badge className="bg-gray-100 text-gray-600 text-[11px] shrink-0">읽기 전용</Badge>
      ) : (
        <>
          <NotificationBell />
          <button
            onClick={() => { logout(); router.push('/login') }}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
            aria-label="로그아웃"
          >
            <LogOut size={18} />
          </button>
        </>
      )}
    </header>
  )
}
