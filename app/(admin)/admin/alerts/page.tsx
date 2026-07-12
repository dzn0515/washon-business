'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import {
  fetchAdminNotifications,
  markAllAdminNotificationsRead,
  markAdminNotificationRead,
  resolveAdminNotificationPath,
  type AdminNotificationItem,
  type AdminNotificationType,
} from '@/lib/admin-api'

const TYPE_LABEL: Record<string, string> = {
  ENTRY_APPLICATION: '신규 입점',
  AD_APPLICATION: '광고 신청',
  NEW_RESERVATION: '신규 예약',
  NEW_MEMBER: '신규 회원',
  BANNER: '배너',
  COUPON: '쿠폰',
  SYSTEM: '시스템',
}

const TYPE_OPTIONS: Array<{ value: '' | AdminNotificationType; label: string }> = [
  { value: '', label: '전체 유형' },
  { value: 'ENTRY_APPLICATION', label: '신규 입점' },
  { value: 'AD_APPLICATION', label: '광고 신청' },
  { value: 'NEW_RESERVATION', label: '신규 예약' },
  { value: 'NEW_MEMBER', label: '신규 회원' },
  { value: 'BANNER', label: '배너' },
  { value: 'COUPON', label: '쿠폰' },
  { value: 'SYSTEM', label: '시스템' },
]

const TYPE_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'neutral' | 'error'> = {
  ENTRY_APPLICATION: 'warning',
  AD_APPLICATION: 'info',
  NEW_RESERVATION: 'success',
  NEW_MEMBER: 'info',
  BANNER: 'neutral',
  COUPON: 'neutral',
  SYSTEM: 'error',
}

const PAGE_SIZE = 20

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminAlertsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminNotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'' | AdminNotificationType>('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminNotifications({
        page,
        pageSize: PAGE_SIZE,
        unreadOnly,
        type: typeFilter || undefined,
      })
      setItems(data.items)
      setUnreadCount(data.unreadCount)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알림을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page, unreadOnly, typeFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => {
      void load()
    }, 30_000)
    return () => window.clearInterval(id)
  }, [load])

  const handleOpen = async (item: AdminNotificationItem) => {
    try {
      if (!item.isRead) {
        await markAdminNotificationRead(item.id)
        setItems((prev) =>
          prev.map((n) =>
            n.id === item.id
              ? { ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }
              : n,
          ),
        )
        setUnreadCount((c) => Math.max(c - 1, 0))
      }
    } catch {
      // still navigate when possible
    }
    const path = resolveAdminNotificationPath(item.linkPath)
    if (path) router.push(path)
  }

  const handleMarkAll = async () => {
    try {
      const result = await markAllAdminNotificationsRead()
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      )
      setUnreadCount(result.unreadCount)
    } catch {
      // ignore
    }
  }

  const tableData = useMemo(
    () =>
      items.map((row) => ({
        _id: row.id,
        type: (
          <AdminBadge
            label={TYPE_LABEL[row.type] ?? row.type}
            variant={TYPE_VARIANT[row.type] ?? 'neutral'}
          />
        ),
        title: (
          <div className={row.isRead ? 'opacity-60' : ''}>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{row.title}</span>
              {!row.isRead ? <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> : null}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{row.message}</p>
          </div>
        ),
        createdAt: (
          <span className="text-xs text-gray-500 whitespace-nowrap">{formatTime(row.createdAt)}</span>
        ),
        status: (
          <AdminBadge
            label={row.isRead ? '읽음' : '미읽음'}
            variant={row.isRead ? 'neutral' : 'warning'}
          />
        ),
        action: (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              void handleOpen(row)
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            이동
          </button>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="알림센터"
        description="입점·광고·예약·회원 등 관리자 알림을 확인합니다"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setPage(1)
                setTypeFilter(e.target.value as '' | AdminNotificationType)
              }}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setPage(1)
                setUnreadOnly((v) => !v)
              }}
              className={`text-sm px-3 py-1.5 rounded-lg border ${
                unreadOnly
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {unreadOnly ? '미읽음만' : '전체 알림'}
            </button>
            <button
              type="button"
              onClick={() => void handleMarkAll()}
              disabled={unreadCount === 0}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              모두 읽음
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              새로고침
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatCard icon="🔔" label="전체 알림" value={total} color="blue" />
        <AdminStatCard icon="🔴" label="미읽음" value={unreadCount} color="red" />
        <AdminStatCard
          icon="✅"
          label="읽음"
          value={Math.max(total - unreadCount, 0)}
          color="green"
        />
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="underline shrink-0">
            재시도
          </button>
        </div>
      ) : null}

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            { key: 'type', label: '유형', width: '110px' },
            { key: 'title', label: '내용' },
            { key: 'createdAt', label: '시각', width: '160px' },
            { key: 'status', label: '상태', width: '90px' },
            { key: 'action', label: '', width: '70px' },
          ]}
          data={tableData}
          emptyMessage="알림이 없습니다."
          onRowClick={(row) => {
            const id = String(row._id ?? '')
            const item = items.find((n) => n.id === id)
            if (item) void handleOpen(item)
          }}
        />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400 px-1">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 px-1">알림이 없습니다.</p>
        ) : (
          items.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => void handleOpen(row)}
              className={`w-full text-left bg-white border border-gray-200 rounded-xl p-4 ${
                row.isRead ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <AdminBadge
                  label={TYPE_LABEL[row.type] ?? row.type}
                  variant={TYPE_VARIANT[row.type] ?? 'neutral'}
                />
                {!row.isRead ? <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> : null}
              </div>
              <p className="text-sm font-medium text-gray-900">{row.title}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{row.message}</p>
              <p className="text-[11px] text-gray-400 mt-2">{formatTime(row.createdAt)}</p>
            </button>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  )
}
