'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import SalesSubNav from '@/components/admin/SalesSubNav'
import {
  fetchAdminSalesAssignments,
  fetchAdminSalesMetrics,
  type AdminSalesAssignment,
  type AdminSalesMetrics,
} from '@/lib/admin-api'

function formatMoney(n: number) {
  return `${n.toLocaleString('ko-KR')}원`
}

const LINKS = [
  { href: '/admin/sales/distributors', label: '총판 관리', desc: '총판 등록·상태 관리' },
  { href: '/admin/sales/agencies', label: '영업점 관리', desc: '총판 하위 영업점' },
  { href: '/admin/sales/agents', label: '영업사원 관리', desc: '고용유형·소속 관리' },
  { href: '/admin/sales/assignments', label: '업체 배정', desc: '배정·재배정·해제' },
  { href: '/admin/sales/commission', label: '수수료 정책', desc: '요율·미리보기 (VAT 제외)' },
]

export default function AdminSalesDashboardPage() {
  const [metrics, setMetrics] = useState<AdminSalesMetrics | null>(null)
  const [assignments, setAssignments] = useState<AdminSalesAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, a] = await Promise.all([
        fetchAdminSalesMetrics(),
        fetchAdminSalesAssignments({ page: 1, pageSize: 10 }),
      ])
      setMetrics(m)
      setAssignments(a.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '영업 현황을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="영업 대시보드"
        description="총판 · 영업점 · 영업사원 · 업체 배정 현황"
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
          >
            새로고침
          </button>
        }
      />

      <SalesSubNav />

      {error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg flex justify-between gap-3">
          <span>{error}</span>
          <button type="button" className="underline" onClick={() => void load()}>
            재시도
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AdminStatCard icon="🏬" label="총판" value={metrics?.distributorCount ?? 0} color="blue" />
        <AdminStatCard icon="🏪" label="영업점" value={metrics?.agencyCount ?? 0} color="blue" />
        <AdminStatCard icon="👤" label="영업사원" value={metrics?.agentCount ?? 0} color="green" />
        <AdminStatCard
          icon="🔗"
          label="배정 업체"
          value={metrics?.assignedPartnerCount ?? 0}
          color="green"
        />
        <AdminStatCard
          icon="📭"
          label="미배정 업체"
          value={metrics?.unassignedPartnerCount ?? 0}
          color="orange"
        />
        <AdminStatCard
          icon="✅"
          label="수수료 대상"
          value={metrics?.activeCommissionPartnerCount ?? 0}
          color="purple"
        />
        <AdminStatCard
          icon="💰"
          label="예상 월 수수료"
          value={formatMoney(metrics?.estimatedMonthlyCommission ?? 0)}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-300 transition-colors"
          >
            <p className="font-medium text-gray-900">{link.label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{link.desc}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">최근 배정</h2>
          <Link href="/admin/sales/assignments" className="text-sm text-blue-600">
            전체 보기
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <AdminTable
            loading={loading}
            columns={[
              { key: 'partner', label: '업체' },
              { key: 'agent', label: '영업사원' },
              { key: 'org', label: '소속' },
              { key: 'commission', label: '예상 수수료', width: '120px' },
              { key: 'assignedAt', label: '배정일', width: '140px' },
            ]}
            data={assignments.map((row) => ({
              partner: (
                <div>
                  <p className="font-medium text-gray-900">{row.partnerName}</p>
                  <p className="text-xs text-gray-500">
                    {row.planTier || '-'} · {row.bizType || '-'}
                  </p>
                </div>
              ),
              agent: <span className="text-sm">{row.salesAgentName}</span>,
              org: (
                <span className="text-sm text-gray-600">
                  {[row.distributorName, row.agencyName].filter(Boolean).join(' / ') || '본사 직속'}
                </span>
              ),
              commission: (
                <span className="text-sm">{formatMoney(row.estimatedMonthlyCommission)}</span>
              ),
              assignedAt: (
                <span className="text-sm text-gray-500">
                  {row.assignedAt ? new Date(row.assignedAt).toLocaleDateString('ko-KR') : '-'}
                </span>
              ),
            }))}
            emptyMessage="배정 내역이 없습니다."
          />
        </div>
      </div>
    </div>
  )
}
