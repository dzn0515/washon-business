'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  mockStats,
  mockRecentBusinesses,
  mockMonthlySignupTrend,
  mockSystemStatus,
  STATUS_LABEL,
} from '@/lib/mock/admin-data'
import { formatMoney } from '@/lib/utils'

const STATUS_DOT = {
  ok: '🟢',
  warn: '🟡',
  error: '🔴',
} as const

export default function AdminDashboardPage() {
  const maxSignup = Math.max(...mockMonthlySignupTrend.map((m) => m.count))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="전체 입점 업체"
          value={`${mockStats.totalBusinesses}개`}
          sub={`↑ 이번달 ${mockStats.newThisMonth}개 신규`}
        />
        <KpiCard
          label="승인 대기"
          value={`${mockStats.pendingCount}개`}
          sub="즉시 처리 필요"
          highlight
        />
        <KpiCard
          label="이번달 총 매출"
          value={formatMoney(mockStats.monthlyRevenue)}
          sub={`↑ 전월 대비 ${mockStats.revenueGrowthPercent}%`}
        />
        <KpiCard
          label="앱 노출 유지비 수익"
          value={formatMoney(mockStats.maintenanceFeeRevenue)}
          sub={`${mockStats.totalBusinesses}개 × ${mockStats.maintenanceFeePerBusiness.toLocaleString()}원`}
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              승인 대기 {mockStats.pendingCount}건 — 빠른 처리가 필요합니다
            </p>
            <p className="text-xs text-amber-700 mt-0.5">신규 입점 신청을 검토해 주세요.</p>
          </div>
        </div>
        <Link
          href="/admin/businesses/pending"
          className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900 shrink-0"
        >
          업체 관리로 이동 <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="최근 입점 업체">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                  <th className="pb-2 font-medium">업체명</th>
                  <th className="pb-2 font-medium">사장님</th>
                  <th className="pb-2 font-medium">신청일</th>
                  <th className="pb-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {mockRecentBusinesses.map((row) => (
                  <tr key={row.name} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 font-medium text-gray-900">{row.name}</td>
                    <td className="py-2.5 text-gray-600">{row.owner}</td>
                    <td className="py-2.5 text-gray-500">{row.appliedAt}</td>
                    <td className="py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="월별 입점 추이">
          <div className="flex items-end gap-2 h-40 pt-2">
            {mockMonthlySignupTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500">{m.count}</span>
                <div
                  className="w-full bg-[#1A6DFF] rounded-t-md min-h-[4px] transition-all"
                  style={{ height: `${(m.count / maxSignup) * 100}%` }}
                />
                <span className="text-[10px] text-gray-400">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="시스템 상태">
        <div className="grid sm:grid-cols-2 gap-3">
          {mockSystemStatus.map((s) => (
            <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
              <span className="text-gray-700">{s.name}</span>
              <span className="text-gray-600">
                {STATUS_DOT[s.status]} {s.detail}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
      }`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-0.5">
        <TrendingUp size={10} className="text-green-500" />
        {sub}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: keyof typeof STATUS_LABEL }) {
  const styles =
    status === 'pending'
      ? 'bg-amber-100 text-amber-700'
      : status === 'active'
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-600'
  return <Badge className={styles}>{STATUS_LABEL[status]}</Badge>
}
