'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminBadge from '@/components/admin/AdminBadge'
import { fetchSystemStatus } from '@/lib/admin-api'
import {
  formatUptime,
  formatKoreaDateTime,
  HEALTH_STATUS_LABEL,
  HEALTH_STATUS_VARIANT,
} from '@/lib/admin-ui'
import type { SystemStatus } from '@/types'

export default function AdminSystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await fetchSystemStatus()
      setStatus(data)
    } catch {
      setError(true)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="시스템"
        description="API·DB 상태 및 배포 정보"
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? '새로고침 중...' : '새로고침'}
          </button>
        }
      />

      {error ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-600">
            시스템 상태 API 미연결 — 운영 환경 연동 후 확인 가능합니다.
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      ) : loading || !status ? (
        <div className="text-sm text-gray-400 py-12 text-center">불러오는 중...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-2">API 상태</p>
              <AdminBadge
                label={HEALTH_STATUS_LABEL[status.apiStatus] ?? status.apiStatus}
                variant={HEALTH_STATUS_VARIANT[status.apiStatus] ?? 'neutral'}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-2">DB 상태</p>
              <AdminBadge
                label={HEALTH_STATUS_LABEL[status.dbStatus] ?? status.dbStatus}
                variant={HEALTH_STATUS_VARIANT[status.dbStatus] ?? 'neutral'}
              />
            </div>
            <AdminStatCard
              icon="⏱️"
              label="업타임"
              value={formatUptime(status.uptime)}
              color="blue"
            />
            <AdminStatCard
              icon="🔌"
              label="활성 연결"
              value={`${status.activeConnections}개`}
              color="green"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">배포 정보</h3>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-gray-400">버전</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{status.version}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">마지막 배포</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {formatKoreaDateTime(status.lastDeployAt)}
                </dd>
              </div>
            </dl>
          </div>
        </>
      )}
    </div>
  )
}
