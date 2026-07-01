'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminTable from '@/components/admin/AdminTable'
import AdminBadge from '@/components/admin/AdminBadge'
import AdminModal from '@/components/admin/AdminModal'
import { useToast } from '@/components/admin/AdminToast'
import {
  fetchAdminLoginLogs,
  fetchBlockedIps,
  blockIp,
  unblockIp,
} from '@/lib/admin-api'
import { formatKoreaDateTime } from '@/lib/admin-ui'
import type { AdminLoginLog, BlockedIp } from '@/types'

const TABS = ['로그인 이력', 'IP 차단'] as const
type Tab = (typeof TABS)[number]

export default function AdminSecurityPage() {
  const { showToast, ToastComponent } = useToast()
  const [tab, setTab] = useState<Tab>('로그인 이력')
  const [logs, setLogs] = useState<AdminLoginLog[]>([])
  const [blocked, setBlocked] = useState<BlockedIp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [newIp, setNewIp] = useState('')
  const [newReason, setNewReason] = useState('')
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [unblockTarget, setUnblockTarget] = useState<BlockedIp | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchAdminLoginLogs()
      setLogs(data)
    } catch {
      setError(true)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadBlocked = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchBlockedIps()
      setBlocked(data)
    } catch {
      setError(true)
      setBlocked([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === '로그인 이력') loadLogs()
    else loadBlocked()
  }, [tab, loadLogs, loadBlocked])

  const handleBlock = async () => {
    if (!newIp.trim() || !newReason.trim()) return
    setActionLoading(true)
    try {
      await blockIp(newIp.trim(), newReason.trim())
      showToast('IP가 차단 목록에 추가되었습니다.', 'success')
      setBlockConfirmOpen(false)
      setNewIp('')
      setNewReason('')
      loadBlocked()
    } catch {
      showToast('IP 차단 저장에 실패했습니다.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!unblockTarget) return
    setActionLoading(true)
    try {
      await unblockIp(unblockTarget.ip)
      showToast('IP 차단이 해제되었습니다.', 'success')
      setUnblockTarget(null)
      loadBlocked()
    } catch {
      showToast('IP 차단 해제에 실패했습니다.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader title="보안" description="관리자 로그인 이력 및 IP 차단 관리" />

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => (tab === '로그인 이력' ? loadLogs() : loadBlocked())}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : tab === '로그인 이력' ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={loading}
            columns={[
              { key: 'adminEmail', label: '관리자' },
              { key: 'ip', label: 'IP' },
              { key: 'success', label: '성공여부' },
              { key: 'userAgent', label: '브라우저' },
              { key: 'createdAt', label: '일시' },
            ]}
            data={logs.map((log) => ({
              adminEmail: log.adminEmail,
              ip: log.ip,
              userAgent: log.userAgent.slice(0, 50),
              createdAt: formatKoreaDateTime(log.createdAt),
              success: (
                <AdminBadge
                  label={log.success ? '성공' : '실패'}
                  variant={log.success ? 'success' : 'error'}
                />
              ),
            }))}
            emptyMessage="로그인 이력이 없습니다."
          />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-400 mb-1">IP 주소</label>
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="192.0.2.1"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-400 mb-1">차단 사유</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="차단 사유 입력"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setBlockConfirmOpen(true)}
              disabled={!newIp.trim() || !newReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              차단 추가
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <AdminTable
              loading={loading}
              columns={[
                { key: 'ip', label: 'IP' },
                { key: 'reason', label: '사유' },
                { key: 'blockedAt', label: '차단일시' },
                { key: 'blockedBy', label: '차단자' },
                { key: 'actions', label: '액션', width: '80px' },
              ]}
              data={blocked.map((b) => ({
                ip: b.ip,
                reason: b.reason,
                blockedAt: formatKoreaDateTime(b.blockedAt),
                blockedBy: b.blockedBy,
                actions: (
                  <button
                    type="button"
                    onClick={() => setUnblockTarget(b)}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    해제
                  </button>
                ),
              }))}
              emptyMessage="차단된 IP가 없습니다."
            />
          </div>
        </>
      )}

      <AdminModal
        open={blockConfirmOpen}
        onClose={() => setBlockConfirmOpen(false)}
        title="IP 차단 확인"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBlockConfirmOpen(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          <strong>{newIp}</strong> IP를 차단 목록에 추가합니다.
          <br />
          사유: {newReason}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          실제 방화벽/middleware 차단은 적용되지 않으며, 목록 저장만 수행됩니다.
        </p>
      </AdminModal>

      <AdminModal
        open={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        title="IP 차단 해제"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setUnblockTarget(null)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleUnblock}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? '처리 중...' : '확인'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          <strong>{unblockTarget?.ip}</strong> IP 차단을 해제하시겠습니까?
        </p>
      </AdminModal>
    </div>
  )
}
