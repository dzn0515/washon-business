/**
 * AUTOON Business Demo — read-only mock data.
 * All demo pages must use this module instead of live API/DB.
 */

import type { Vehicle, VehicleRecord } from '@/types'

export {
  mockBusiness,
  mockDashboardToday,
  mockBookings,
  mockCustomers,
  mockStaffMembers,
  mockRevenueLast7Days,
  mockWeeklyRevenue,
  mockMonthlyRevenueTrend,
  mockRevenueTodayKpi,
  mockRevenueWeeklyKpi,
  mockRevenueMonthlyKpi,
  mockRevenueByMenu,
  mockPaymentsToday,
  mockCustomerStats,
  mockMonthlyReservationStats,
  mockMonthlyBookingTrend,
  mockSettlements,
  mockNotifications,
  mockBays,
  mockBusinessHours,
  mockCoupons,
  mockMenuCards,
  getLongTermAbsentCount,
  mapMockBookings,
  toBusinessEntity,
} from '@/lib/mock/data'

export const DEMO_STORE_ID = 'demo-store-hgd-wash'

export const demoBusiness = {
  id: DEMO_STORE_ID,
  name: '행복드림 세차장',
  slug: 'happy-dream-wash',
  phone: '031-123-4567',
  address: '경기도 성남시 분당구 정자동 123-4',
  booking_mode: 'AUTO' as const,
  plan: 'STANDARD',
}

export const demoVehicles: Vehicle[] = [
  {
    id: 'demo-v-1',
    license_plate: '12가 3456',
    brand: '현대',
    model: '소나타',
    year: 2022,
    color: '흰색',
  },
  {
    id: 'demo-v-2',
    license_plate: '34나 5678',
    brand: '기아',
    model: 'K5',
    year: 2021,
    color: '검정',
  },
  {
    id: 'demo-v-3',
    license_plate: '56다 7890',
    brand: '현대',
    model: '아반떼',
    year: 2023,
    color: '은색',
  },
  {
    id: 'demo-v-4',
    license_plate: '78라 1234',
    brand: 'BMW',
    model: '520d',
    year: 2020,
    color: '네이비',
  },
  {
    id: 'demo-v-5',
    license_plate: '90마 5678',
    brand: '르노',
    model: 'QM6',
    year: 2019,
    color: '흰색',
  },
]

export const demoVehicleRecords: Record<string, VehicleRecord[]> = {
  'demo-v-1': [
    {
      id: 'demo-vr-1',
      vehicle_id: 'demo-v-1',
      store_id: DEMO_STORE_ID,
      service_type: 'wash',
      mileage: 42300,
      photos: [],
      memo: '실내 먼지 제거 요청',
      next_service_date: '2026-07-25',
      created_at: '2026-06-25T09:30:00Z',
    },
    {
      id: 'demo-vr-2',
      vehicle_id: 'demo-v-1',
      store_id: DEMO_STORE_ID,
      service_type: 'wash',
      mileage: 40100,
      photos: [],
      memo: '정기 세차',
      created_at: '2026-06-11T10:00:00Z',
    },
  ],
  'demo-v-2': [
    {
      id: 'demo-vr-3',
      vehicle_id: 'demo-v-2',
      store_id: DEMO_STORE_ID,
      service_type: 'detail',
      mileage: 28700,
      photos: [],
      memo: '외부 광택 포함',
      created_at: '2026-06-25T10:30:00Z',
    },
  ],
  'demo-v-3': [
    {
      id: 'demo-vr-4',
      vehicle_id: 'demo-v-3',
      store_id: DEMO_STORE_ID,
      service_type: 'wash',
      mileage: 15200,
      photos: [],
      created_at: '2026-06-25T11:00:00Z',
    },
  ],
  'demo-v-4': [
    {
      id: 'demo-vr-5',
      vehicle_id: 'demo-v-4',
      store_id: DEMO_STORE_ID,
      service_type: 'detail',
      mileage: 67800,
      photos: [],
      memo: '디테일링 풀코스',
      next_service_date: '2026-09-25',
      created_at: '2026-05-10T13:00:00Z',
    },
  ],
  'demo-v-5': [],
}

export function getDemoVehicleRecords(vehicleId: string): VehicleRecord[] {
  return demoVehicleRecords[vehicleId] ?? []
}

export type DemoAiInsight = {
  id: string
  type: 'revenue' | 'customer' | 'booking' | 'staff'
  title: string
  summary: string
  metric?: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

export const demoAiInsights: DemoAiInsight[] = [
  {
    id: 'ai-1',
    type: 'customer',
    title: '30일 미방문 고객 4명',
    summary: '최근 30일 이상 방문하지 않은 단골 고객에게 리마인드 쿠폰을 보내면 재방문율이 평균 18% 상승합니다.',
    metric: '4명',
    action: '리마인드 쿠폰 발송 제안',
    priority: 'high',
  },
  {
    id: 'ai-2',
    type: 'revenue',
    title: '오후 2–4시 예약 공백',
    summary: '이번 주 오후 시간대 예약률이 62%입니다. AUTOON 노출을 확대하거나 할인 쿠폰으로 공백을 채울 수 있습니다.',
    metric: '62%',
    action: '오후 타임 할인 쿠폰 생성',
    priority: 'high',
  },
  {
    id: 'ai-3',
    type: 'booking',
    title: '금요일 예약 집중',
    summary: '금요일 예약이 전체의 28%를 차지합니다. 토요일 오전 슬롯을 홍보하면 주말 매출 균형을 맞출 수 있습니다.',
    metric: '28%',
    action: '토요일 오전 프로모션',
    priority: 'medium',
  },
  {
    id: 'ai-4',
    type: 'staff',
    title: '홍길동 직원 배정 과다',
    summary: '이번 주 홍길동 직원 배정이 58%로 편중되어 있습니다. 김철수 직원에게 일부 예약을 분배하는 것을 권장합니다.',
    metric: '58%',
    action: '직원 배정 균형 조정',
    priority: 'medium',
  },
  {
    id: 'ai-5',
    type: 'revenue',
    title: '디테일링 메뉴 성장',
    summary: '디테일링 풀코스 예약이 지난달 대비 23% 증가했습니다. 프리미엄 메뉴 노출을 강화해 보세요.',
    metric: '+23%',
    action: '프리미엄 메뉴 상단 노출',
    priority: 'low',
  },
]

export const demoAiSummary = {
  score: 82,
  label: '운영 양호',
  tips_count: demoAiInsights.length,
  auto_actions_today: 3,
}
