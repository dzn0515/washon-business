'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, isLive, markRead, markAllRead, refetch } =
    useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void refetch()
        }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
        aria-label="알림"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border border-gray-100 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
            <span className="text-sm font-semibold text-gray-900">알림</span>
            {unreadCount > 0 && isLive ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs text-blue-600"
              >
                모두 읽음
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="text-xs text-gray-400 px-3 py-4">불러오는 중...</p>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-4">알림이 없습니다.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-gray-50 last:border-0">
                  {n.booking_id ? (
                    <Link
                      href={`/bookings/${n.booking_id}`}
                      onClick={() => {
                        void markRead(n.id)
                        setOpen(false)
                      }}
                      className={`block px-3 py-2.5 hover:bg-gray-50 ${n.is_read ? 'opacity-60' : ''}`}
                    >
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void markRead(n.id)}
                      className={`block w-full text-left px-3 py-2.5 hover:bg-gray-50 ${n.is_read ? 'opacity-60' : ''}`}
                    >
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
