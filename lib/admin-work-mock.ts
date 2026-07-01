import type {
  RecentWorkLog,
  SystemStatusItem,
  TodayDashboardStats,
  TodaySchedule,
  UrgentTask,
  WorkTodayStats,
} from '@/types'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

// 개발/데모용 Mock 데이터
// 현재 개발/데모 단계에서는 production에서도 Mock 데이터를 반환한다.
// 추후 실제 API 연결 시 Mock 함수를 API 호출로 교체한다.

export async function fetchWorkTodayStats(): Promise<WorkTodayStats> {
  await delay()
  return {
    pendingApproval: 5,
    todayReservations: 42,
    unansweredInquiries: 12,
    newReviews: 8,
    alertCount: 1,
  }
}

export async function fetchUrgentTasks(): Promise<UrgentTask[]> {
  await delay()
  return [
    {
      id: 'u1',
      priority: 'critical',
      label: '업체 승인 대기',
      count: 5,
      href: '/admin/businesses',
    },
    {
      id: 'u2',
      priority: 'high',
      label: '고객 문의 미처리',
      count: 12,
      href: '/admin/cs',
    },
    {
      id: 'u3',
      priority: 'medium',
      label: '서버 경고',
      count: 1,
      href: '/admin/system',
    },
  ]
}

export async function fetchTodaySchedule(): Promise<TodaySchedule[]> {
  await delay()
  return [
    { id: 's1', time: '09:00', title: '운영회의' },
    { id: 's2', time: '11:00', title: '업체 미팅' },
    { id: 's3', time: '14:00', title: '점검' },
    { id: 's4', time: '18:00', title: '정산' },
  ]
}

export async function fetchRecentWorkLogs(): Promise<RecentWorkLog[]> {
  await delay()
  const now = Date.now()
  return [
    {
      id: 'l1',
      action: '업체 승인',
      target: '반짝반짝 세차장',
      createdAt: new Date(now - 10 * 60_000).toISOString(),
    },
    {
      id: 'l2',
      action: '예약 취소',
      target: '김민수 · 기본세차',
      createdAt: new Date(now - 35 * 60_000).toISOString(),
    },
    {
      id: 'l3',
      action: '공지 등록',
      target: '6월 정기 점검 안내',
      createdAt: new Date(now - 2 * 3_600_000).toISOString(),
    },
    {
      id: 'l4',
      action: 'QR 생성',
      target: '클린카 디테일링',
      createdAt: new Date(now - 4 * 3_600_000).toISOString(),
    },
    {
      id: 'l5',
      action: '문의 답변',
      target: '결제 오류 문의',
      createdAt: new Date(now - 6 * 3_600_000).toISOString(),
    },
  ]
}

export async function fetchWorkSystemStatus(): Promise<SystemStatusItem[]> {
  await delay()
  return [
    { name: 'API', status: 'healthy' },
    { name: 'DB', status: 'healthy' },
    { name: 'Storage', status: 'healthy' },
    { name: 'Push', status: 'healthy' },
    { name: 'Redis', status: 'healthy' },
  ]
}

export async function fetchTodayDashboardStats(): Promise<TodayDashboardStats> {
  await delay()
  return {
    todayReservations: 42,
    todaySignups: 3,
    todayRevenue: 1_280_000,
    todayCancels: 2,
    todayReviews: 8,
  }
}
