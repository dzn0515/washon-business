'use client'

import Link from 'next/link'
import {
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  RefreshCw,
  Timer,
  Users,
  Wallet,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState'
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions'
import DashboardSection from '@/components/dashboard/DashboardSection'
import OperationalInsightsSection from '@/components/dashboard/OperationalInsightsSection'
import RecentCustomerList from '@/components/dashboard/RecentCustomerList'
import RevenueTrendChart from '@/components/dashboard/RevenueTrendChart'
import StaffSummarySection from '@/components/dashboard/StaffSummarySection'
import { useDemoMode } from '@/components/providers/DemoModeProvider'
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from '@/constants'
import { formatDateLabel } from '@/lib/api-mappers'
import { CARD, won } from '@/lib/dashboard-ui'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import { useDashboardExtras } from '@/lib/hooks/useDashboardExtras'
import {
  useDashboardToday,
  type DashboardTodayBooking,
} from '@/lib/hooks/useDashboardToday'
import { useOperationalInsights } from '@/lib/hooks/useOperationalInsights'
import { resolveResourceLabel } from '@/lib/resource-label'

function BookingRow({
  booking,
  date,
  href,
}: {
  booking: DashboardTodayBooking
  date: string
  href: (path: string) => string
}) {
  return (
    <Link
      href={href(`/bookings/${booking.id}?date=${date}`)}
      className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{booking.customer_name}</p>
        <p className="text-xs text-gray-400 truncate">
          {booking.start_time}–{booking.end_time} · {booking.service_name}
          {booking.bay_name ? ` · ${booking.bay_name}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge className={BOOKING_STATUS_STYLE[booking.status]}>
          {BOOKING_STATUS_LABEL[booking.status]}
        </Badge>
        <span className="text-xs text-gray-500">{won(booking.price)}</span>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { today, loading, isDemo, isUnavailable, refetch, todayDate } = useDashboardToday()
  const { display: businessDisplay } = useBusinessMe()
  const resourceLabel = resolveResourceLabel(
    businessDisplay?.bizType,
    businessDisplay?.resourceLabel,
  )
  const {
    insights,
    loading: insightsLoading,
    isLive: insightsLive,
    isDemo: insightsDemo,
  } = useOperationalInsights()
  const extras = useDashboardExtras()
  const { href } = useDemoMode()
  const sc = today.status_counts
  const storeName = businessDisplay?.name?.trim() || '매장'

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 truncate">
            안녕하세요, {storeName} 사장님
          </h2>
          <p className="mt-1 text-sm text-gray-500">오늘 매장 현황을 확인하세요.</p>
          <p className="mt-0.5 text-xs text-gray-400">{formatDateLabel()}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isDemo && !loading ? (
            <span className="hidden sm:inline text-xs text-amber-600">데모 데이터</span>
          ) : isUnavailable ? (
            <span className="text-xs text-red-600">데이터 오류</span>
          ) : null}
          {!isDemo ? (
            <button
              type="button"
              onClick={() => {
                void refetch()
                void extras.refetchSales()
                void extras.refetchCustomers()
              }}
              disabled={loading}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              새로고침
            </button>
          ) : null}
        </div>
      </div>

      <DashboardQuickActions href={href} />

      {isUnavailable ? (
        <div className={`${CARD} py-10 text-center`}>
          <p className="text-sm font-medium text-gray-800">운영 데이터를 불러올 수 없습니다</p>
          <p className="mt-1 text-xs text-gray-500">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <DashboardMetricCard
            label="오늘 예약"
            value={`${today.total_bookings}건`}
            hint={
              sc.cancelled + sc.noshow > 0
                ? `취소 ${sc.cancelled} · 노쇼 ${sc.noshow}`
                : '오늘 접수된 예약'
            }
            icon={CalendarCheck2}
            tone="blue"
            href={href('/dashboard/reservations')}
            loading={loading}
          />
          <DashboardMetricCard
            label="진행 중"
            value={`${sc.in_progress}건`}
            hint={`대기 ${sc.pending} · 확정 ${sc.confirmed}`}
            icon={Timer}
            tone="orange"
            href={href('/dashboard/reservations')}
            loading={loading}
          />
          <DashboardMetricCard
            label="완료"
            value={`${sc.completed}건`}
            hint="오늘 완료된 예약"
            icon={CheckCircle2}
            tone="emerald"
            href={href('/dashboard/reservations')}
            loading={loading}
          />
          <DashboardMetricCard
            label="오늘 예상 매출"
            value={won(today.expected_revenue)}
            hint="예약 금액 기준"
            icon={Wallet}
            tone="violet"
            href={href('/dashboard/revenue')}
            loading={loading}
          />
          <DashboardMetricCard
            label={`사용 중 ${resourceLabel}`}
            value={`${today.bay_summary.busy_now}`}
            hint={`가용 ${today.bay_summary.available_now} / 활성 ${today.bay_summary.active}`}
            icon={LayoutGrid}
            tone="sky"
            href={href('/dashboard/operations/bays')}
            loading={loading}
          />
          <DashboardMetricCard
            label="전체 고객"
            value={`${extras.totalCustomers.toLocaleString()}명`}
            hint={
              extras.customersError
                ? '고객 집계 오류'
                : `이번 달 신규 ${extras.newCustomersThisMonth}명`
            }
            icon={Users}
            tone="slate"
            href={href('/dashboard/customers')}
            loading={extras.customersLoading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <DashboardSection
          title="최근 7일 매출 추이"
          actionHref={href('/dashboard/revenue')}
          actionLabel="매출 상세"
          className="xl:col-span-3"
        >
          <RevenueTrendChart
            series={extras.series}
            loading={extras.salesLoading}
            error={extras.salesError}
            onRetry={() => void extras.refetchSales()}
          />
        </DashboardSection>

        <DashboardSection
          title="최근 고객"
          actionHref={href('/dashboard/customers')}
          actionLabel="전체보기"
          className="xl:col-span-2"
        >
          <RecentCustomerList
            customers={extras.customers}
            loading={extras.customersLoading}
            error={extras.customersError}
            href={href}
            onRetry={() => void extras.refetchCustomers()}
          />
        </DashboardSection>
      </div>

      <StaffSummarySection
        today={today}
        isLive={!isUnavailable && !isDemo}
        isUnavailable={isUnavailable}
        todayDate={todayDate}
      />

      <OperationalInsightsSection
        insights={insights}
        loading={insightsLoading}
        isLive={insightsLive}
        isDemo={insightsDemo}
        compact
      />

      {!isUnavailable ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DashboardSection title="지금 진행 중">
            {today.current_bookings.length === 0 ? (
              <DashboardEmptyState
                title="현재 진행 중인 예약이 없습니다"
                description="진행 중인 예약이 생기면 여기에 표시됩니다."
              />
            ) : (
              today.current_bookings.map((b) => (
                <BookingRow key={b.id} booking={b} date={todayDate} href={href} />
              ))
            )}
          </DashboardSection>

          <DashboardSection
            title="다음 예약"
            actionHref={href('/dashboard/reservations')}
            actionLabel="전체보기"
          >
            {today.next_bookings.length === 0 ? (
              <DashboardEmptyState
                title="남은 예약이 없습니다"
                description="새 예약을 등록하면 일정을 바로 확인할 수 있습니다."
                actionHref={href('/dashboard/reservations')}
                actionLabel="예약 관리"
              />
            ) : (
              today.next_bookings.map((b) => (
                <BookingRow key={b.id} booking={b} date={todayDate} href={href} />
              ))
            )}
          </DashboardSection>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Link
          href={href('/dashboard/reservations/calendar')}
          className="text-sm text-blue-600 font-medium flex items-center gap-0.5"
        >
          {resourceLabel} 캘린더 보기 <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}
