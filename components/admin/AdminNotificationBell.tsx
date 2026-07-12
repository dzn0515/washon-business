'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { resolveAdminNotificationPath } from '@/lib/admin-api'
import { useAdminNotifications } from '@/lib/hooks/useAdminNotifications'

const TYPE_LABEL: Record<string, string> = {
  ENTRY_APPLICATION: '신규 입점',
  AD_APPLICATION: '광고 신청',
  NEW_RESERVATION: '신규 예약',
  NEW_MEMBER: '신규 회원',
  BANNER: '배너',
  COUPON: '쿠폰',
  SYSTEM: '시스템',
}

function formatRelative(iso: string) {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diffSec = Math.round((Date.now() - t) / 1000)
  if (diffSec < 60) return '방금 전'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminNotificationBell() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isLive,
    markRead,
    markAllRead,
    refetch,
  } = useAdminNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void refetch()
        }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 text-lg"
        aria-label="알림"
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-1.5rem))] max-h-96 overflow-auto bg-white border border-gray-100 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 sticky top-0 bg-white">
            <span className="text-sm font-semibold text-gray-900">알림</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && isLive ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs text-blue-600"
                >
                  모두 읽음
                </button>
              ) : null}
              <Link
                href="/admin/alerts"
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                전체보기
              </Link>
            </div>
          </div>

          {loading && notifications.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-4">불러오는 중...</p>
          ) : error && notifications.length === 0 ? (
            <div className="px-3 py-4 space-y-2">
              <p className="text-xs text-red-500">알림을 불러오지 못했습니다.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="text-xs text-blue-600"
              >
                다시 시도
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-4">알림이 없습니다.</p>
          ) : (
            <ul>
              {notifications.slice(0, 20).map((n) => (
                <li key={n.id} className="border-b border-gray-50 last:border-0">
                  <button
                    type="button"
                    onClick={() => {
                      void markRead(n.id)
                      setOpen(false)
                      const path = resolveAdminNotificationPath(n.linkPath)
                      if (path) router.push(path)
                    }}
                    className={`block w-full text-left px-3 py-2.5 hover:bg-gray-50 ${
                      n.isRead ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {TYPE_LABEL[n.type] ?? n.type}
                      </span>
                      {!n.isRead ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
