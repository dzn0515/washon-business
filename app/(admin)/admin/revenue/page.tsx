'use client'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  mockStats,
  mockRevenueRows,
  mockBusinessRevenue,
  mockMonthlyRevenueTrend,
  mockSettlement,
} from '@/lib/mock/admin-data'
import { formatMoney } from '@/lib/utils'

export default function AdminRevenuePage() {
  const maxRevenue = Math.max(...mockMonthlyRevenueTrend.map((m) => m.amount))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="이번달 총 거래액" value={formatMoney(mockStats.monthlyRevenue)} />
        <Kpi label="AUTOON 수익 (유지비)" value={formatMoney(mockStats.maintenanceFeeRevenue)} />
        <Kpi label="예약 수수료 수익" value={`${formatMoney(mockStats.bookingFeeRevenue)} (Phase 3)`} muted />
        <Kpi label="광고 수익" value={formatMoney(mockStats.adRevenue)} />
      </div>

      <Card title="업체별 매출">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">업체명</th>
                <th className="pb-2 font-medium">이번달 예약</th>
                <th className="pb-2 font-medium">매출</th>
                <th className="pb-2 font-medium">유지비 납부</th>
                <th className="pb-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {mockBusinessRevenue.map((row) => (
                <tr key={row.name} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="py-3 text-gray-600">{row.bookings}건</td>
                  <td className="py-3 text-gray-800">{formatMoney(row.revenue)}</td>
                  <td className="py-3">
                    <Badge
                      className={
                        row.maintenancePaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {row.maintenancePaid ? '정상' : '미납'}
                    </Badge>
                  </td>
                  <td className="py-3 text-gray-500">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="월별 수익 추이">
        <div className="flex items-end gap-2 h-44 pt-2">
          {mockMonthlyRevenueTrend.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-[9px] text-gray-400 truncate w-full text-center">
                {(m.amount / 1_000_000).toFixed(0)}M
              </span>
              <div
                className="w-full bg-[#1A6DFF] rounded-t-md min-h-[4px]"
                style={{ height: `${(m.amount / maxRevenue) * 100}%` }}
              />
              <span className="text-[10px] text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="거래 내역">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">날짜</th>
                <th className="pb-2 font-medium">업체명</th>
                <th className="pb-2 font-medium">항목</th>
                <th className="pb-2 font-medium">금액</th>
                <th className="pb-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {mockRevenueRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 text-gray-500">{row.date}</td>
                  <td className="py-3 font-medium text-gray-900">{row.business}</td>
                  <td className="py-3 text-gray-600">{row.item}</td>
                  <td className="py-3 text-gray-800">{formatMoney(row.amount)}</td>
                  <td className="py-3">
                    <Badge
                      className={
                        row.status === '완료' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="정산 현황">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-400">미정산</span>
              <p className="font-semibold text-amber-600">{mockSettlement.pending}건</p>
            </div>
            <div>
              <span className="text-gray-400">완료</span>
              <p className="font-semibold text-green-600">{mockSettlement.completed}건</p>
            </div>
          </div>
          <Button variant="secondary">정산서 일괄 다운로드</Button>
        </div>
      </Card>
    </div>
  )
}

function Kpi({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold mt-1 ${muted ? 'text-gray-400' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
