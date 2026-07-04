'use client'

import { useEffect, useState } from 'react'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminBadge from '@/components/admin/AdminBadge'
import {
  fetchAdminStats,
  fetchRecentReservations,
  fetchRecentBusinesses,
  type AdminBusinessListItem,
} from '@/lib/admin-api'
import { BUSINESS_TYPE_LABELS } from '@/lib/business-types'

const BOOKING_STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  pending: 'warning',
  confirmed: 'info',
  arrived: 'info',
  in_progress: 'warning',
  completed: 'success',
  paid: 'success',
  cancelled: 'error',
  noshow: 'error',
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: '예약접수',
  confirmed: '예약확정',
  arrived: '입차',
  in_progress: '작업중',
  completed: '완료',
  paid: '결제완료',
  cancelled: '취소',
  noshow: '노쇼',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [reservations, setReservations] = useState<Record<string, string>[]>([])
  const [businesses, setBusinesses] = useState<AdminBusinessListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchRecentReservations(), fetchRecentBusinesses()])
      .then(([s, r, b]) => {
        setStats(s)
        setReservations(r)
        setBusinesses(b)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <AdminPageHeader title="대시보드" description="AUTOON 플랫폼 전체 현황" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          icon="🏪"
          label="전체 업체"
          value={stats?.totalBusinesses ?? '-'}
          color="blue"
        />
        <AdminStatCard
          icon="✅"
          label="운영 중"
          value={stats?.activeBusinesses ?? '-'}
          color="green"
        />
        <AdminStatCard
          icon="📅"
          label="오늘 예약"
          value={stats?.todayReservations ?? '-'}
          color="blue"
        />
        <AdminStatCard
          icon="⚡"
          label="진행 중"
          value={stats?.ongoingReservations ?? '-'}
          color="orange"
        />
        <AdminStatCard
          icon="💰"
          label="오늘 매출"
          value={stats ? `${stats.todayRevenue.toLocaleString()}원` : '-'}
          color="green"
        />
        <AdminStatCard
          icon="📈"
          label="이번 달 매출"
          value={stats ? `${stats.monthRevenue.toLocaleString()}원` : '-'}
          color="blue"
        />
        <AdminStatCard
          icon="🆕"
          label="신규 가입"
          value={stats?.newBusinesses ?? '-'}
          color="purple"
        />
        <AdminStatCard
          icon="⏳"
          label="승인 대기"
          value={stats?.pendingBusinesses ?? '-'}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">최근 예약</h3>
            <a href="/admin/reservations" className="text-xs text-blue-600 hover:underline">
              전체보기
            </a>
          </div>
          <AdminTable
            loading={loading}
            columns={[
              { key: 'businessName', label: '업체' },
              { key: 'customerName', label: '고객' },
              { key: 'menu', label: '메뉴' },
              { key: 'status', label: '상태' },
            ]}
            data={reservations.map((r) => ({
              ...r,
              status: (
                <AdminBadge
                  label={BOOKING_STATUS_LABEL[r.status] ?? r.status}
                  variant={BOOKING_STATUS_VARIANT[r.status] ?? 'neutral'}
                />
              ),
            }))}
            emptyMessage="최근 예약이 없습니다."
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">최근 가입 업체</h3>
            <a href="/admin/businesses" className="text-xs text-blue-600 hover:underline">
              전체보기
            </a>
          </div>
          <AdminTable
            loading={loading}
            columns={[
              { key: 'name', label: '업체명' },
              { key: 'bizType', label: '업종' },
              { key: 'status', label: '상태' },
              { key: 'createdAt', label: '가입일' },
            ]}
            data={businesses.map((b) => ({
              ...b,
              bizType: BUSINESS_TYPE_LABELS[b.bizType] ?? b.bizType,
              status: (
                <AdminBadge
                  label={
                    b.status === 'active'
                      ? '운영중'
                      : b.status === 'pending'
                        ? '승인대기'
                        : b.status
                  }
                  variant={
                    b.status === 'active'
                      ? 'success'
                      : b.status === 'pending'
                        ? 'warning'
                        : 'neutral'
                  }
                />
              ),
            }))}
            emptyMessage="가입 업체가 없습니다."
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">서버 상태</h3>
        <div className="flex flex-wrap gap-6">
          {[
            { label: 'API 서버', status: '정상' },
            { label: 'DB', status: '정상' },
            { label: 'Push', status: '정상' },
            { label: 'Storage', status: '정상' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className="text-xs text-green-600 font-medium">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
