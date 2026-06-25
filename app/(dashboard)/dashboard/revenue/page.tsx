'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'
import { useRevenue } from '@/lib/hooks/useRevenue'
import {
  mockRevenueLast7Days,
  mockWeeklyRevenue,
  mockMonthlyRevenueTrend,
} from '@/lib/mock/data'
import { CARD, won } from '@/lib/dashboard-ui'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

type Tab = 'today' | 'week' | 'month'

export default function RevenuePage() {
  const [tab, setTab] = useState<Tab>('today')
  const { todayKpi, weeklyKpi, monthlyKpi, byMenu, paymentsToday } = useRevenue()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: '오늘' },
    { key: 'week', label: '주간' },
    { key: 'month', label: '월간' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">매출 현황</h2>
        <button type="button" className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:bg-gray-50">
          <Download size={14} /> 정산서 다운로드
        </button>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              tab === t.key ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">오늘 매출</p>
              <p className="text-lg font-semibold">{won(todayKpi.today_sales)}</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">완료 건수</p>
              <p className="text-lg font-semibold">{todayKpi.completed_count}건</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">미정산 금액</p>
              <p className="text-lg font-semibold">{won(todayKpi.pending_settlement)}</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">앱 노출 유지비</p>
              <p className="text-lg font-semibold">{won(todayKpi.app_maintenance_fee)}/월</p>
            </div>
          </div>

          <div className={CARD}>
            <p className="text-[12px] text-gray-400 font-medium mb-2">최근 7일 매출</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRevenueLast7Days}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v) => won(Number(v ?? 0))} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={CARD}>
            <p className="text-[12px] text-gray-400 font-medium mb-3">메뉴별 매출</p>
            <div className="space-y-3">
              {byMenu.map((m) => (
                <div key={m.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{m.name}</span>
                    <span className="font-medium">{won(m.amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={CARD}>
            <p className="text-[12px] text-gray-400 font-medium mb-3">오늘 결제 내역</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[12px] text-gray-400 border-b border-gray-50">
                    <th className="pb-2 font-medium">시간</th>
                    <th className="pb-2 font-medium">고객</th>
                    <th className="pb-2 font-medium">메뉴</th>
                    <th className="pb-2 font-medium text-right">금액</th>
                    <th className="pb-2 font-medium text-right">결제</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsToday.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 text-blue-600">{p.time}</td>
                      <td className="py-2.5">{p.customer_name}</td>
                      <td className="py-2.5 text-gray-500">{p.menu}</td>
                      <td className="py-2.5 text-right font-medium">{won(p.amount)}</td>
                      <td className="py-2.5 text-right text-gray-400">{p.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'week' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">이번주 매출</p>
              <p className="text-lg font-semibold">{won(weeklyKpi.week_sales)}</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">이번주 예약</p>
              <p className="text-lg font-semibold">{weeklyKpi.week_bookings}건</p>
            </div>
          </div>
          <div className={CARD}>
            <p className="text-[12px] text-gray-400 font-medium mb-2">요일별 매출</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockWeeklyRevenue}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v) => won(Number(v ?? 0))} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'month' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">이번달 매출</p>
              <p className="text-lg font-semibold">{won(monthlyKpi.month_sales)}</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">이번달 예약</p>
              <p className="text-lg font-semibold">{monthlyKpi.month_bookings}건</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">플랫폼 수수료</p>
              <p className="text-lg font-semibold">{won(monthlyKpi.platform_fee)}</p>
            </div>
            <div className={CARD}>
              <p className="text-[12px] text-gray-400 font-medium mb-2">앱 노출 유지비</p>
              <p className="text-lg font-semibold">{won(monthlyKpi.app_maintenance_fee)}/월</p>
            </div>
          </div>

          <div className={CARD}>
            <p className="text-[12px] text-gray-400 font-medium mb-2">월별 매출 추이</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockMonthlyRevenueTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v) => won(Number(v ?? 0))} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={CARD}>
            <p className="text-[12px] text-gray-400 font-medium mb-3">메뉴별 이번달 매출</p>
            <div className="space-y-3">
              {byMenu.map((m) => (
                <div key={m.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{m.name}</span>
                    <span className="font-medium">{won(m.amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
