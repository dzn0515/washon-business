'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminBadge from '@/components/admin/AdminBadge'
import {
  fetchRecentWorkLogs,
  fetchTodayDashboardStats,
  fetchTodaySchedule,
  fetchUrgentTasks,
  fetchWorkSystemStatus,
  fetchWorkTodayStats,
} from '@/lib/admin-work-mock'
import { HEALTH_STATUS_LABEL, HEALTH_STATUS_VARIANT, formatKoreaDateTime } from '@/lib/admin-ui'
import type {
  RecentWorkLog,
  SystemStatusItem,
  TodayDashboardStats,
  TodaySchedule,
  UrgentTask,
  WorkTodayStats,
} from '@/types'

const PRIORITY_ICON: Record<UrgentTask['priority'], string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
}

const TODAY_TASKS: {
  key: keyof WorkTodayStats
  icon: string
  label: string
  href: string
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}[] = [
  { key: 'pendingApproval', icon: '🏪', label: '승인 대기 업체', href: '/admin/businesses', color: 'orange' },
  { key: 'todayReservations', icon: '📅', label: '오늘 예약', href: '/admin/reservations', color: 'blue' },
  { key: 'unansweredInquiries', icon: '🎧', label: '미답변 문의', href: '/admin/cs', color: 'red' },
  { key: 'newReviews', icon: '⭐', label: '신규 리뷰', href: '/admin/dashboard#', color: 'purple' },
  { key: 'alertCount', icon: '⚡', label: '장애 알림', href: '/admin/system', color: 'red' },
]

const QUICK_ACTIONS = [
  { label: '업체 등록', href: '/admin/businesses' },
  { label: '예약 조회', href: '/admin/reservations' },
  { label: '공지 작성', href: '/admin/notices' },
  { label: 'QR 생성', href: '/admin/qr' },
  { label: '결제 조회', href: '/admin/dashboard#' },
  { label: '쿠폰 발급', href: '/admin/dashboard#' },
  { label: '고객 검색', href: '/admin/dashboard#' },
  { label: '운영 설정', href: '/admin/settings' },
] as const

const LOG_ACTION_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  '업체 승인': 'success',
  '예약 취소': 'error',
  '공지 등록': 'info',
  'QR 생성': 'neutral',
  '문의 답변': 'success',
}

export default function AdminMyWorkPage() {
  const [loading, setLoading] = useState(true)
  const [todayStats, setTodayStats] = useState<WorkTodayStats | null>(null)
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([])
  const [schedule, setSchedule] = useState<TodaySchedule[]>([])
  const [workLogs, setWorkLogs] = useState<RecentWorkLog[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatusItem[]>([])
  const [dashboardStats, setDashboardStats] = useState<TodayDashboardStats | null>(null)

  useEffect(() => {
    Promise.all([
      fetchWorkTodayStats(),
      fetchUrgentTasks(),
      fetchTodaySchedule(),
      fetchRecentWorkLogs(),
      fetchWorkSystemStatus(),
      fetchTodayDashboardStats(),
    ])
      .then(([stats, urgent, sched, logs, sys, dash]) => {
        setTodayStats(stats)
        setUrgentTasks(urgent)
        setSchedule(sched)
        setWorkLogs(logs)
        setSystemStatus(sys)
        setDashboardStats(dash)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="내 업무"
        description="오늘 처리해야 하는 업무를 한눈에 확인합니다."
      />

      <Section title="오늘 해야 할 일">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {TODAY_TASKS.map((task) => (
            <div key={task.key} className="space-y-3">
              <AdminStatCard
                icon={task.icon}
                label={task.label}
                value={loading ? '-' : (todayStats?.[task.key] ?? 0)}
                color={task.color}
              />
              <Link
                href={task.href}
                className="block text-center text-xs font-medium text-blue-600 border border-blue-100 bg-white rounded-lg py-2 hover:bg-blue-50 transition-colors"
              >
                바로가기
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section title="긴급 업무">
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {loading ? (
            <p className="p-4 text-sm text-gray-400">불러오는 중...</p>
          ) : urgentTasks.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">긴급 업무가 없습니다.</p>
          ) : (
            urgentTasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-800">
                  {PRIORITY_ICON[task.priority]} {task.label}{' '}
                  <span className="font-semibold">{task.count}건</span>
                </span>
                <span className="text-xs text-blue-600">이동 →</span>
              </Link>
            ))
          )}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="오늘 일정">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            {loading ? (
              <p className="text-sm text-gray-400">불러오는 중...</p>
            ) : (
              <ul className="space-y-4">
                {schedule.map((item, idx) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-blue-600 w-12">{item.time}</span>
                      {idx < schedule.length - 1 && (
                        <span className="w-px flex-1 bg-gray-200 mt-2 min-h-[16px]" />
                      )}
                    </div>
                    <p className="text-sm text-gray-800 pt-0.5">{item.title}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
              추후 API 연결 예정
            </p>
          </div>
        </Section>

        <Section title="최근 작업">
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {loading ? (
              <p className="p-4 text-sm text-gray-400">불러오는 중...</p>
            ) : (
              workLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AdminBadge
                        label={log.action}
                        variant={LOG_ACTION_VARIANT[log.action] ?? 'neutral'}
                      />
                      <span className="text-sm text-gray-700 truncate">{log.target}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {formatKoreaDateTime(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>

      <Section title="빠른 실행">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 text-center hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="시스템 상태">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(loading ? [] : systemStatus).map((item) => (
            <div
              key={item.name}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
              <AdminBadge
                label={HEALTH_STATUS_LABEL[item.status] ?? item.status}
                variant={HEALTH_STATUS_VARIANT[item.status] ?? 'neutral'}
              />
            </div>
          ))}
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 h-12 animate-pulse"
              />
            ))}
        </div>
      </Section>

      <Section title="오늘 통계">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <AdminStatCard
            icon="📅"
            label="오늘 예약"
            value={loading ? '-' : `${dashboardStats?.todayReservations ?? 0}건`}
            color="blue"
          />
          <AdminStatCard
            icon="👤"
            label="오늘 가입"
            value={loading ? '-' : `${dashboardStats?.todaySignups ?? 0}건`}
            color="green"
          />
          <AdminStatCard
            icon="💰"
            label="오늘 매출"
            value={
              loading ? '-' : `${(dashboardStats?.todayRevenue ?? 0).toLocaleString()}원`
            }
            color="purple"
          />
          <AdminStatCard
            icon="❌"
            label="오늘 취소"
            value={loading ? '-' : `${dashboardStats?.todayCancels ?? 0}건`}
            color="red"
          />
          <AdminStatCard
            icon="⭐"
            label="오늘 리뷰"
            value={loading ? '-' : `${dashboardStats?.todayReviews ?? 0}건`}
            color="orange"
          />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  )
}
