'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Badge from '@/components/ui/Badge'
import { useDailyRevenue, useRevenueDashboard } from '@/lib/hooks/useRevenue'
import { CARD, won, BTN_PRIMARY } from '@/lib/dashboard-ui'
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '@/constants'
import { mapPaymentMethod, mapPaymentStatus } from '@/lib/api-mappers'
import type { RevenuePeriodKey } from '@/lib/hooks/useRevenue'

const PERIODS: { key: RevenuePeriodKey; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: '7d', label: '최근 7일' },
  { key: 'month', label: '이번 달' },
  { key: 'last_month', label: '지난달' },
  { key: 'custom', label: '직접 선택' },
]

export default function RevenuePage() {
  const {
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    summary,
    series,
    byMenu,
    tx,
    txTotal,
    txPage,
    setTxPage,
    setQ,
    status,
    setStatus,
    loading,
    error,
    refetch,
  } = useRevenueDashboard()
  const {
    data: daily,
    loading: dailyLoading,
    error: dailyError,
    isLive: dailyLive,
    selectedDate,
    setSelectedDate,
    refetch: refetchDaily,
  } = useDailyRevenue()
  const [searchInput, setSearchInput] = useState('')

  const chartData = useMemo(
    () =>
      series.map((p) => ({
        label: p.label,
        amount: p.amount ?? p.netSales,
      })),
    [series],
  )

  const txPages = Math.max(1, Math.ceil(txTotal / 20))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">매출관리</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              period === p.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' ? (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          />
          <span className="text-gray-400">~</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          />
        </div>
      ) : null}

      {loading ? <p className="text-xs text-gray-400">불러오는 중...</p> : null}
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 flex justify-between gap-3">
          <span>매출 데이터를 불러오지 못했습니다.</span>
          <button type="button" className={BTN_PRIMARY} onClick={() => void refetch()}>
            다시 시도
          </button>
        </div>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className={CARD}>
            <p className="text-[12px] text-gray-400">총매출</p>
            <p className="text-lg font-semibold">{won(summary.grossSales)}</p>
          </div>
          <div className={CARD}>
            <p className="text-[12px] text-gray-400">환불</p>
            <p className="text-lg font-semibold text-red-600">{won(summary.refundAmount)}</p>
          </div>
          <div className={CARD}>
            <p className="text-[12px] text-gray-400">순매출</p>
            <p className="text-lg font-semibold text-green-700">{won(summary.netSales)}</p>
          </div>
          <div className={CARD}>
            <p className="text-[12px] text-gray-400">완료 건수</p>
            <p className="text-lg font-semibold">{summary.completedCount.toLocaleString()}건</p>
          </div>
          <div className={CARD}>
            <p className="text-[12px] text-gray-400">객단가</p>
            <p className="text-lg font-semibold">{won(summary.averageOrderValue)}</p>
          </div>
          <div className={CARD}>
            <p className="text-[12px] text-gray-400">이전 기간 대비</p>
            <p className={`text-lg font-semibold ${summary.comparedPreviousPeriod >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {summary.comparedPreviousPeriod >= 0 ? '+' : ''}
              {won(summary.comparedPreviousPeriod)} ({summary.comparedPreviousPeriodRate}%)
            </p>
          </div>
        </div>
      ) : null}

      <div className={CARD}>
        <p className="text-sm font-medium text-gray-900 mb-3">매출 추이</p>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">선택한 기간의 매출 내역이 없습니다.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={56} />
                <Tooltip formatter={(v) => won(Number(v))} />
                <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className={CARD}>
        <p className="text-sm font-medium text-gray-900 mb-3">서비스별 매출</p>
        {byMenu.length === 0 ? (
          <p className="text-sm text-gray-500">표시할 서비스 매출이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {byMenu.map((m) => {
              const name = m.menuName ?? m.menu_name ?? '기타'
              return (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{name}</span>
                  <span className="text-gray-900 font-medium">
                    {won(m.amount)} <span className="text-gray-400 text-xs">({m.pct}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className={CARD}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <p className="text-sm font-medium text-gray-900 mr-auto">매출 내역</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setQ(searchInput.trim())
            }}
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="고객·예약번호·차량"
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              <option value="">전체 상태</option>
              <option value="COMPLETED">완료</option>
              <option value="PAID">결제완료</option>
              <option value="REVIEWED">리뷰완료</option>
              <option value="REFUNDED">환불</option>
            </select>
            <button type="submit" className="text-xs text-blue-600 font-medium">
              검색
            </button>
          </form>
        </div>
        {tx.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">선택한 기간의 매출 내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] text-gray-400 border-b border-gray-50">
                  <th className="pb-2 font-medium">일시</th>
                  <th className="pb-2 font-medium">고객</th>
                  <th className="pb-2 font-medium">서비스</th>
                  <th className="pb-2 font-medium text-right">순매출</th>
                  <th className="pb-2 font-medium">결제</th>
                </tr>
              </thead>
              <tbody>
                {tx.map((row) => {
                  const ps = mapPaymentStatus(row.paymentStatus)
                  const date = row.booking_date ?? row.bookedAt?.slice(0, 10) ?? ''
                  const time = (row.start_time ?? '').slice(0, 5)
                  return (
                    <tr key={row.reservationId} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5">
                        <Link
                          href={`/bookings/${row.reservationId}?date=${date}`}
                          className="text-blue-600 hover:underline"
                        >
                          {date} {time}
                        </Link>
                      </td>
                      <td className="py-2.5">{row.customerName ?? row.customer_name ?? '-'}</td>
                      <td className="py-2.5">{row.serviceName ?? row.menu_name ?? '-'}</td>
                      <td className="py-2.5 text-right font-medium">{won(row.netAmount)}</td>
                      <td className="py-2.5">
                        <Badge className={PAYMENT_STATUS_STYLE[ps] ?? 'bg-gray-100 text-gray-600'}>
                          {PAYMENT_STATUS_LABEL[ps] ?? row.paymentStatus}
                        </Badge>
                        <span className="ml-1 text-xs text-gray-400">
                          {PAYMENT_METHOD_LABEL[mapPaymentMethod(row.paymentMethod)] ?? row.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {txPages > 1 ? (
          <div className="flex items-center justify-center gap-2 pt-3">
            <button
              type="button"
              disabled={txPage <= 1}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
              onClick={() => setTxPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <span className="text-xs text-gray-500">
              {txPage} / {txPages}
            </span>
            <button
              type="button"
              disabled={txPage >= txPages}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
              onClick={() => setTxPage((p) => Math.min(txPages, p + 1))}
            >
              다음
            </button>
          </div>
        ) : null}
      </div>

      <div className={CARD}>
        <div className="flex items-center gap-2 mb-3">
          <label htmlFor="revenue-date" className="text-sm text-gray-500 shrink-0">
            일별 상세
          </label>
          <input
            id="revenue-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          />
          {dailyLoading ? <span className="text-xs text-gray-400">불러오는 중...</span> : null}
          {dailyError ? (
            <button type="button" className="text-xs text-blue-600" onClick={() => void refetchDaily(selectedDate)}>
              다시 시도
            </button>
          ) : null}
        </div>
        {dailyLive && daily ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[12px] text-gray-400">총 예약금액</p>
                <p className="text-lg font-semibold">{won(daily.total_booking_amount)}</p>
              </div>
              <div>
                <p className="text-[12px] text-gray-400">결제완료</p>
                <p className="text-lg font-semibold text-green-700">{won(daily.paid_amount)}</p>
              </div>
              <div>
                <p className="text-[12px] text-gray-400">미결제</p>
                <p className="text-lg font-semibold text-amber-700">{won(daily.unpaid_amount)}</p>
              </div>
              <div>
                <p className="text-[12px] text-gray-400">환불</p>
                <p className="text-lg font-semibold text-red-600">{won(daily.refunded_amount)}</p>
              </div>
            </div>
            {daily.items.length === 0 ? (
              <p className="text-sm text-gray-500">해당 날짜 매출 데이터가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[12px] text-gray-400 border-b border-gray-50">
                      <th className="pb-2 font-medium">시간</th>
                      <th className="pb-2 font-medium">고객</th>
                      <th className="pb-2 font-medium">메뉴</th>
                      <th className="pb-2 font-medium text-right">예약금액</th>
                      <th className="pb-2 font-medium">결제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.items.map((row) => {
                      const ps = mapPaymentStatus(row.payment_status)
                      return (
                        <tr key={row.booking_id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2.5">
                            <Link
                              href={`/bookings/${row.booking_id}?date=${row.booking_date}`}
                              className="text-blue-600 hover:underline"
                            >
                              {row.start_time.slice(0, 5)}
                            </Link>
                          </td>
                          <td className="py-2.5">{row.customer_name}</td>
                          <td className="py-2.5">{row.menu_name ?? '-'}</td>
                          <td className="py-2.5 text-right">{won(row.price)}</td>
                          <td className="py-2.5">
                            <Badge className={PAYMENT_STATUS_STYLE[ps] ?? 'bg-gray-100 text-gray-600'}>
                              {PAYMENT_STATUS_LABEL[ps] ?? row.payment_status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : !dailyLoading ? (
          <p className="text-sm text-gray-500">해당 날짜 매출 데이터가 없습니다.</p>
        ) : null}
      </div>
    </div>
  )
}
