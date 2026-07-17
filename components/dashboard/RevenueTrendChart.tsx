'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'
import { won } from '@/lib/dashboard-ui'
import type { ApiSalesTimeseriesPoint } from '@/lib/revenue-api'
import { BarChart3 } from 'lucide-react'

export default function RevenueTrendChart({
  series,
  loading,
  error,
  onRetry,
}: {
  series: ApiSalesTimeseriesPoint[]
  loading: boolean
  error: string | null
  onRetry?: () => void
}) {
  const chartData = useMemo(
    () =>
      series.map((p) => ({
        label: p.label.length >= 10 ? p.label.slice(5) : p.label,
        amount: p.netSales ?? p.amount ?? 0,
      })),
    [series],
  )

  if (loading) return <DashboardSkeleton rows={4} />

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-red-600">매출 추이를 불러오지 못했습니다.</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-xs font-medium text-blue-600"
          >
            다시 시도
          </button>
        ) : null}
      </div>
    )
  }

  const hasData = chartData.some((d) => d.amount > 0)
  if (!hasData) {
    return (
      <DashboardEmptyState
        icon={BarChart3}
        title="아직 매출 데이터가 없습니다"
        description="완료된 예약이 쌓이면 최근 매출 추이가 여기에 표시됩니다."
      />
    )
  }

  return (
    <div className="h-56 w-full min-w-0 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) =>
              v >= 10000 ? `${Math.round(v / 10000)}만` : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
            formatter={(value) => [won(Number(value ?? 0)), '순매출']}
            labelStyle={{ color: '#6b7280', fontSize: 12 }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #f3f4f6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          />
          <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
