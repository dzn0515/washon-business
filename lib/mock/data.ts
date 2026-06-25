// lib/mock/data.ts
// WashOn 영업 데모용 Mock 데이터

import type {
  Booking, BookingStatus, Business, BusinessHours, Coupon, Customer,
  Holiday, Notification, ServiceMenu, Settlement, Staff, WeeklyBookingStat,
} from '@/types'

export const mockDashboard = {
  today_bookings: 7,
  today_bookings_diff: +3,
  today_revenue: 115000,
  monthly_revenue: 5800000,
  monthly_revenue_diff: 12,
  unsettled_amount: 1260000,
  unsettled_date: 'D+2 정산 예정',
  new_customers: 12,
  new_customers_diff: +4,
  app_exposure: 2847,
}

export const mockTodayBookings = [
  {
    id: 1,
    booking_number: 'B20260625001',
    time: '09:30',
    customer_name: '김민수',
    service_name: '중형 실내외 세차',
    car_number: '12가 3456',
    car_model: '현대 소나타',
    staff_name: '홍길동',
    status: 'COMPLETED',
    price: 35000,
  },
  {
    id: 2,
    booking_number: 'B20260625002',
    time: '10:30',
    customer_name: '이영희',
    service_name: '외부 세차 + 광택',
    car_number: '34나 5678',
    car_model: '기아 K5',
    staff_name: '김철수',
    status: 'COMPLETED',
    price: 55000,
  },
  {
    id: 3,
    booking_number: 'B20260625003',
    time: '11:00',
    customer_name: '박철수',
    service_name: '소형 실내외 세차',
    car_number: '56다 7890',
    car_model: '현대 아반떼',
    staff_name: '홍길동',
    status: 'IN_PROGRESS',
    price: 25000,
  },
  {
    id: 4,
    booking_number: 'B20260625004',
    time: '13:00',
    customer_name: '최지원',
    service_name: '디테일링 풀코스',
    car_number: '78라 1234',
    car_model: 'BMW 5시리즈',
    staff_name: '김철수',
    status: 'CONFIRMED',
    price: 150000,
  },
  {
    id: 5,
    booking_number: 'B20260625005',
    time: '14:30',
    customer_name: '정수진',
    service_name: '중형 실내외 세차',
    car_number: '90마 5678',
    car_model: '르노 QM6',
    staff_name: '홍길동',
    status: 'CONFIRMED',
    price: 35000,
  },
  {
    id: 6,
    booking_number: 'B20260625006',
    time: '15:30',
    customer_name: '강동원',
    service_name: '외부 세차',
    car_number: '11바 2345',
    car_model: '테슬라 모델3',
    staff_name: '김철수',
    status: 'CONFIRMED',
    price: 20000,
  },
  {
    id: 7,
    booking_number: 'B20260625007',
    time: '17:00',
    customer_name: '윤서연',
    service_name: '중형 실내외 세차',
    car_number: '33사 6789',
    car_model: '볼보 XC60',
    staff_name: '홍길동',
    status: 'PENDING',
    price: 40000,
  },
]

export const mockWeeklyChart = [
  { day: '월', count: 5 },
  { day: '화', count: 8 },
  { day: '수', count: 6 },
  { day: '목', count: 7 },
  { day: '금', count: 0 },
  { day: '토', count: 0 },
  { day: '일', count: 0 },
]

export const mockNotifications = [
  {
    id: 1,
    message: '최지원님이 디테일링 풀코스를 예약했습니다.',
    time: '10분 전',
    type: 'BOOKING',
  },
  {
    id: 2,
    message: '5월 정산 1,120,000원이 완료되었습니다.',
    time: '어제',
    type: 'SETTLEMENT',
  },
  {
    id: 3,
    message: '김민수님이 리뷰를 남겼습니다. ★★★★★',
    time: '어제',
    type: 'REVIEW',
  },
]

type DemoBooking = (typeof mockTodayBookings)[number] & { date?: string }

export const mockBookings: DemoBooking[] = [
  ...mockTodayBookings,
  {
    id: 8,
    booking_number: 'B20260624001',
    time: '10:00',
    customer_name: '한지민',
    service_name: '대형 실내외 세차',
    car_number: '55아 1234',
    car_model: '기아 카니발',
    staff_name: '홍길동',
    status: 'COMPLETED',
    price: 50000,
    date: '2026-06-24',
  },
  {
    id: 9,
    booking_number: 'B20260624002',
    time: '14:00',
    customer_name: '오준혁',
    service_name: '외부 세차',
    car_number: '77자 5678',
    car_model: '현대 그랜저',
    staff_name: '김철수',
    status: 'COMPLETED',
    price: 25000,
    date: '2026-06-24',
  },
  {
    id: 10,
    booking_number: 'B20260624003',
    time: '16:00',
    customer_name: '임수빈',
    service_name: '코팅 서비스',
    car_number: '99차 9012',
    car_model: '포르쉐 카이엔',
    staff_name: '김철수',
    status: 'NO_SHOW',
    price: 200000,
    date: '2026-06-24',
  },
]

type DemoCustomer = {
  user_id: number
  name: string
  phone: string
  grade: string
  visit_count: number
  total_spent: number
  last_visit_at: string
  next_recommended_visit: string
  car_number: string
  car_model: string
  memo: string
}

export const mockCustomers: DemoCustomer[] = [
  {
    user_id: 1,
    name: '김민수',
    phone: '010-1234-5678',
    grade: 'VIP',
    visit_count: 28,
    total_spent: 840000,
    last_visit_at: '2026-06-25',
    next_recommended_visit: '2026-07-09',
    car_number: '12가 3456',
    car_model: '현대 소나타',
    memo: '단골 VIP, 실내 탈취 요청 자주 함',
  },
  {
    user_id: 2,
    name: '이영희',
    phone: '010-2345-6789',
    grade: 'GOLD',
    visit_count: 15,
    total_spent: 525000,
    last_visit_at: '2026-06-25',
    next_recommended_visit: '2026-07-09',
    car_number: '34나 5678',
    car_model: '기아 K5',
    memo: '',
  },
  {
    user_id: 3,
    name: '최지원',
    phone: '010-3456-7890',
    grade: 'GOLD',
    visit_count: 12,
    total_spent: 960000,
    last_visit_at: '2026-06-25',
    next_recommended_visit: '2026-07-16',
    car_number: '78라 1234',
    car_model: 'BMW 5시리즈',
    memo: '고급 세차 선호, 디테일링 단골',
  },
  {
    user_id: 4,
    name: '박철수',
    phone: '010-4567-8901',
    grade: 'SILVER',
    visit_count: 7,
    total_spent: 175000,
    last_visit_at: '2026-06-25',
    next_recommended_visit: '2026-07-09',
    car_number: '56다 7890',
    car_model: '현대 아반떼',
    memo: '',
  },
  {
    user_id: 5,
    name: '정수진',
    phone: '010-5678-9012',
    grade: 'NORMAL',
    visit_count: 3,
    total_spent: 95000,
    last_visit_at: '2026-06-25',
    next_recommended_visit: '2026-07-09',
    car_number: '90마 5678',
    car_model: '르노 QM6',
    memo: '',
  },
  {
    user_id: 6,
    name: '한지민',
    phone: '010-6789-0123',
    grade: 'SILVER',
    visit_count: 9,
    total_spent: 360000,
    last_visit_at: '2026-06-24',
    next_recommended_visit: '2026-07-08',
    car_number: '55아 1234',
    car_model: '기아 카니발',
    memo: '대형차, 꼼꼼한 세차 요청',
  },
  {
    user_id: 7,
    name: '강보람',
    phone: '010-7890-1234',
    grade: 'GOLD',
    visit_count: 18,
    total_spent: 630000,
    last_visit_at: '2026-05-10',
    next_recommended_visit: '2026-05-24',
    car_number: '22카 3456',
    car_model: '벤츠 E클래스',
    memo: '장기 미방문 → 쿠폰 발송 필요',
  },
  {
    user_id: 8,
    name: '윤태호',
    phone: '010-8901-2345',
    grade: 'SILVER',
    visit_count: 6,
    total_spent: 180000,
    last_visit_at: '2026-05-02',
    next_recommended_visit: '2026-05-16',
    car_number: '44타 7890',
    car_model: '현대 투싼',
    memo: '',
  },
]

export const mockSettlements = {
  year: 2026,
  month: 6,
  summary: {
    total_sales: 4800000,
    platform_fee: 480000,
    settled_amount: 4320000,
  },
  daily: [
    { date: '06.25', booking_count: 7, total_sales: 360000, platform_fee: 36000, settled_amount: 324000, status: 'PENDING' as const },
    { date: '06.24', booking_count: 8, total_sales: 420000, platform_fee: 42000, settled_amount: 378000, status: 'PENDING' as const },
    { date: '06.23', booking_count: 6, total_sales: 290000, platform_fee: 29000, settled_amount: 261000, status: 'SETTLED' as const },
    { date: '06.22', booking_count: 9, total_sales: 480000, platform_fee: 48000, settled_amount: 432000, status: 'SETTLED' as const },
    { date: '06.21', booking_count: 5, total_sales: 210000, platform_fee: 21000, settled_amount: 189000, status: 'SETTLED' as const },
  ],
}

export const mockMenus = [
  {
    id: 1,
    service_type_code: 'CAR_WASH' as const,
    service_type_name: '세차',
    name: '소형 실내외 세차',
    description: '경차/소형차 실내외 완전 세차',
    duration_minutes: 40,
    base_price: 25000,
    is_active: true,
    distance_pricing: [] as { distance_label: string; max_distance_km: number | null; price: number }[],
  },
  {
    id: 2,
    service_type_code: 'CAR_WASH' as const,
    service_type_name: '세차',
    name: '중형 실내외 세차',
    description: '중형차 실내외 완전 세차',
    duration_minutes: 60,
    base_price: 35000,
    is_active: true,
    distance_pricing: [
      { distance_label: '5km 이내', max_distance_km: 5, price: 35000 },
      { distance_label: '10km 이내', max_distance_km: 10, price: 42000 },
      { distance_label: '10km 초과', max_distance_km: null, price: 50000 },
    ],
  },
  {
    id: 3,
    service_type_code: 'CAR_WASH' as const,
    service_type_name: '세차',
    name: '대형 실내외 세차',
    description: 'SUV/대형차/승합차',
    duration_minutes: 80,
    base_price: 50000,
    is_active: true,
    distance_pricing: [],
  },
  {
    id: 4,
    service_type_code: 'CAR_WASH' as const,
    service_type_name: '세차',
    name: '외부 세차',
    description: '외부만 빠르게',
    duration_minutes: 20,
    base_price: 15000,
    is_active: true,
    distance_pricing: [],
  },
  {
    id: 5,
    service_type_code: 'DETAILING' as const,
    service_type_name: '디테일링',
    name: '디테일링 풀코스',
    description: '내외부 완전 복원',
    duration_minutes: 180,
    base_price: 150000,
    is_active: true,
    distance_pricing: [],
  },
  {
    id: 6,
    service_type_code: 'COATING' as const,
    service_type_name: '코팅/PPF',
    name: '유리막 코팅',
    description: '차량 전체 유리막 코팅',
    duration_minutes: 240,
    base_price: 200000,
    is_active: true,
    distance_pricing: [],
  },
]

export const mockBusiness = {
  id: 1,
  name: '홍길동세차장',
  slug: 'hgdwash',
  description: '원주에서 10년 경력의 전문 세차장입니다.',
  phone: '033-123-4567',
  address: '강원도 원주시 무실동 123-45',
  primary_color: '#1565C0',
  logo_url: null as string | null,
  banner_url: null as string | null,
  booking_mode: 'AUTO' as const,
  plan: 'BASIC' as const,
  is_featured: true,
  service_types: ['CAR_WASH', 'DETAILING', 'COATING'] as const,
}

export const mockCoupons = [
  {
    id: 1,
    name: '첫 방문 감사 쿠폰',
    discount_type: 'FIXED' as const,
    discount_value: 5000,
    min_price: 20000,
    valid_from: '2026-06-01',
    valid_until: '2026-06-30',
    issue_type: 'MANUAL' as const,
    issue_count: 15,
    use_count: 8,
    is_active: true,
  },
  {
    id: 2,
    name: '단골 고객 10% 할인',
    discount_type: 'PERCENT' as const,
    discount_value: 10,
    min_price: 30000,
    valid_from: '2026-06-01',
    valid_until: '2026-07-31',
    issue_type: 'MANUAL' as const,
    issue_count: 5,
    use_count: 3,
    is_active: true,
  },
  {
    id: 3,
    name: '장기 미방문 복귀 쿠폰',
    discount_type: 'FIXED' as const,
    discount_value: 8000,
    min_price: 25000,
    valid_from: '2026-06-01',
    valid_until: '2026-07-15',
    issue_type: 'LONGTERM' as const,
    issue_count: 3,
    use_count: 1,
    is_active: true,
  },
]

export const mockStaff = [
  { id: 1, name: '홍길동', role: '대표', phone: '010-1234-5678', is_active: true },
  { id: 2, name: '김철수', role: '직원', phone: '010-9876-5432', is_active: true },
]

export const mockCustomerStats = {
  total: 284,
  new: 12,
  regular: 67,
  regular_pct: 23,
  vip: 18,
}

export const mockMonthlyReservationStats = {
  total: 127,
  completed: 118,
  no_show: 9,
}

export const mockWeeklyRevenue = [
  { day: '월', amount: 420000 },
  { day: '화', amount: 510000 },
  { day: '수', amount: 380000 },
  { day: '목', amount: 460000 },
  { day: '금', amount: 290000 },
  { day: '토', amount: 620000 },
  { day: '일', amount: 480000 },
]

export const mockMonthlyBookingTrend = [
  { week: '1주', count: 28 },
  { week: '2주', count: 32 },
  { week: '3주', count: 35 },
  { week: '4주', count: 32 },
]

export const mockRevenueLast7Days = [
  { date: '06.19', amount: 400000 },
  { date: '06.20', amount: 315000 },
  { date: '06.21', amount: 210000 },
  { date: '06.22', amount: 480000 },
  { date: '06.23', amount: 290000 },
  { date: '06.24', amount: 420000 },
  { date: '06.25', amount: 360000 },
]

export const mockRevenueByMenu = [
  { name: '중형 실내외 세차', amount: 1120000, pct: 32 },
  { name: '디테일링 풀코스', amount: 750000, pct: 21 },
  { name: '외부 세차', amount: 480000, pct: 14 },
  { name: '소형 실내외 세차', amount: 420000, pct: 12 },
  { name: '대형 실내외 세차', amount: 380000, pct: 11 },
  { name: '기타', amount: 350000, pct: 10 },
]

export const mockPaymentsToday = mockTodayBookings
  .filter((b) => b.status === 'COMPLETED' || b.status === 'IN_PROGRESS')
  .map((b) => ({
    id: b.id,
    time: b.time,
    customer_name: b.customer_name,
    menu: b.service_name,
    amount: b.price,
    method: '앱결제',
  }))

export const mockRevenueTodayKpi = {
  today_sales: 360000,
  completed_count: 2,
  pending_settlement: 1260000,
  app_maintenance_fee: 28000,
}

export const mockRevenueWeeklyKpi = {
  week_sales: 3160000,
  week_bookings: 42,
}

export const mockRevenueMonthlyKpi = {
  month_sales: 5800000,
  month_bookings: 127,
  platform_fee: 580000,
  app_maintenance_fee: 28000,
}

export const mockMonthlyRevenueTrend = [
  { month: '1월', amount: 3200000 },
  { month: '2월', amount: 3800000 },
  { month: '3월', amount: 4100000 },
  { month: '4월', amount: 4500000 },
  { month: '5월', amount: 5170000 },
  { month: '6월', amount: 5800000 },
]

export const mockAds = {
  monthly_exposure: 2847,
  clicks: 312,
  booking_conversions: 38,
  radius_km: 5,
  conversion_rate: 1.3,
  app_maintenance_fee: 28000,
}

export const mockExposurePlans = [
  { id: 'basic', label: '기본 반경', radius: '5km', extra_fee: 0, selected: true },
  { id: 'extend', label: '확장 반경', radius: '10km', extra_fee: 15000, selected: false },
  { id: 'wide', label: '광역 반경', radius: '30km', extra_fee: 30000, selected: false },
  { id: 'nation', label: '전국 노출', radius: '전국', extra_fee: 50000, selected: false },
]

export const mockPremiumProducts = [
  { id: 1, name: '상단 고정 노출', desc: '검색 결과 최상단 7일', price: 50000, badge: '인기' },
  { id: 2, name: '메인 배너', desc: '앱 홈 화면 배너 3일', price: 80000, badge: null },
  { id: 3, name: '푸시 알림', desc: '반경 5km 고객 대상 1회', price: 30000, badge: null },
  { id: 4, name: '리뷰 부스팅', desc: '리뷰 작성 고객 쿠폰 자동 발송', price: 20000, badge: '신규' },
]

export const mockMenuCards = [
  { id: 1, name: '소형 실내외 세차', duration_minutes: 40, monthly_bookings: 42, is_popular: true, is_active: true, price_grid: { domestic_small: 25000, domestic_medium: 30000, domestic_large: 35000, import_small: 31250, import_medium: 36250, import_large: 41250 } },
  { id: 2, name: '중형 실내외 세차', duration_minutes: 60, monthly_bookings: 58, is_popular: true, is_active: true, price_grid: { domestic_small: 35000, domestic_medium: 42000, domestic_large: 49000, import_small: 43750, import_medium: 50750, import_large: 57750 } },
  { id: 3, name: '대형 실내외 세차', duration_minutes: 80, monthly_bookings: 24, is_popular: false, is_active: true, price_grid: { domestic_small: 50000, domestic_medium: 60000, domestic_large: 70000, import_small: 62500, import_medium: 72500, import_large: 82500 } },
  { id: 4, name: '외부 세차', duration_minutes: 20, monthly_bookings: 31, is_popular: false, is_active: true, price_grid: { domestic_small: 15000, domestic_medium: 18000, domestic_large: 21000, import_small: 18750, import_medium: 21750, import_large: 24750 } },
  { id: 5, name: '디테일링 풀코스', duration_minutes: 180, monthly_bookings: 12, is_popular: false, is_active: true, price_grid: { domestic_small: 150000, domestic_medium: 180000, domestic_large: 210000, import_small: 187500, import_medium: 217500, import_large: 247500 } },
  { id: 6, name: '유리막 코팅', duration_minutes: 240, monthly_bookings: 3, is_popular: false, is_active: false, price_grid: { domestic_small: 200000, domestic_medium: 240000, domestic_large: 280000, import_small: 250000, import_medium: 290000, import_large: 330000 } },
]

export const mockHolidayCards = [
  { id: 1, date: '2026-06-25', reason: '우천 휴무 (오후)', type: 'RAIN' },
  { id: 2, date: '2026-08-15', reason: '광복절', type: 'HOLIDAY' },
]

export const mockCustomerVisitHistory: Record<number, { date: string; menu: string; amount: number }[]> = {
  1: [
    { date: '2026-06-25', menu: '중형 실내외 세차', amount: 35000 },
    { date: '2026-06-11', menu: '중형 실내외 세차', amount: 35000 },
    { date: '2026-05-28', menu: '외부 세차 + 광택', amount: 55000 },
  ],
  2: [
    { date: '2026-06-25', menu: '외부 세차 + 광택', amount: 55000 },
    { date: '2026-06-04', menu: '중형 실내외 세차', amount: 35000 },
  ],
}

// ── 어댑터 (기존 API 레이어 호환) ──

const TODAY = '2026-06-25'

export function toBooking(raw: DemoBooking): Booking {
  return {
    id: raw.id,
    booking_number: raw.booking_number,
    user: { id: raw.id, name: raw.customer_name, phone: '' },
    vehicle: { car_number: raw.car_number, car_model: raw.car_model },
    service_menu: { name: raw.service_name, duration_minutes: 60 },
    staff: raw.staff_name ? { id: 1, name: raw.staff_name } : null,
    booking_date: raw.date ?? TODAY,
    booking_time: raw.time,
    price: raw.price,
    status: raw.status as BookingStatus,
    memo: '',
    customer_request: '',
    created_at: raw.date ?? TODAY,
  }
}

function toCustomer(raw: DemoCustomer): Customer {
  return {
    user_id: raw.user_id,
    name: raw.name,
    phone: raw.phone.replace(/-/g, ''),
    grade: raw.grade as Customer['grade'],
    visit_count: raw.visit_count,
    total_spent: raw.total_spent,
    last_visit_at: raw.last_visit_at,
    next_recommended_visit: raw.next_recommended_visit,
    vehicles: [{ car_number: raw.car_number, car_model: raw.car_model }],
    memo: raw.memo,
  }
}

export function toBusinessEntity(): Business {
  return {
    id: mockBusiness.id,
    name: mockBusiness.name,
    slug: mockBusiness.slug,
    description: mockBusiness.description,
    phone: mockBusiness.phone,
    address: mockBusiness.address,
    lat: 37.342,
    lng: 127.920,
    logo_url: mockBusiness.logo_url ?? '',
    banner_url: mockBusiness.banner_url ?? '',
    primary_color: mockBusiness.primary_color,
    booking_mode: mockBusiness.booking_mode,
    plan: mockBusiness.plan,
    is_featured: mockBusiness.is_featured,
    service_types: [...mockBusiness.service_types],
    approval_status: 'APPROVED',
  }
}

export const mockBusinessHours: BusinessHours[] = [
  { day: 0, label: '일', is_open: false, open_time: '09:00', close_time: '18:00' },
  { day: 1, label: '월', is_open: true, open_time: '09:00', close_time: '19:00' },
  { day: 2, label: '화', is_open: true, open_time: '09:00', close_time: '19:00' },
  { day: 3, label: '수', is_open: true, open_time: '09:00', close_time: '19:00' },
  { day: 4, label: '목', is_open: true, open_time: '09:00', close_time: '19:00' },
  { day: 5, label: '금', is_open: true, open_time: '09:00', close_time: '20:00' },
  { day: 6, label: '토', is_open: true, open_time: '09:00', close_time: '18:00' },
]

export const mockHolidaysList: Holiday[] = [
  { id: 1, date: '2026-08-15', reason: '광복절' },
]

export function mapMockBookings(status?: string): Booking[] {
  let list = mockBookings.map(toBooking)
  if (status && status !== 'ALL') {
    list = list.filter((b) => b.status === status)
  }
  return list
}

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

export const mockApi = {
  getBusiness: async () => { await delay(); return toBusinessEntity() },
  getBookings: async (filters?: { status?: string }) => {
    await delay()
    let list = mockBookings.map(toBooking)
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((b) => b.status === filters.status)
    }
    return list
  },
  getBooking: async (id: number) => {
    await delay()
    const b = mockBookings.find((x) => x.id === id)
    if (!b) throw new Error('Not found')
    return toBooking(b)
  },
  getCustomers: async () => { await delay(); return mockCustomers.map(toCustomer) },
  getCustomer: async (id: number) => {
    await delay()
    const c = mockCustomers.find((x) => x.user_id === id)
    if (!c) throw new Error('Not found')
    return toCustomer(c)
  },
  getMenus: async () => { await delay(); return mockMenus as ServiceMenu[] },
  getSettlements: async () => {
    await delay()
    return mockSettlements.daily.map((d) => ({
      date: d.date,
      booking_count: d.booking_count,
      total_sales: d.total_sales,
      platform_fee: d.platform_fee,
      settled_amount: d.settled_amount,
      status: d.status,
    })) as Settlement[]
  },
  getCoupons: async () => { await delay(); return mockCoupons as Coupon[] },
  getStaff: async () => {
    await delay()
    return mockStaff.map((s) => ({ id: s.id, name: s.name, is_active: s.is_active })) as Staff[]
  },
  getHours: async () => { await delay(); return mockBusinessHours },
  getHolidays: async () => { await delay(); return mockHolidaysList },
  getDashboardSummary: async () => {
    await delay()
    return {
      today_bookings: mockDashboard.today_bookings,
      month_sales: mockDashboard.monthly_revenue,
      unsettled_amount: mockDashboard.unsettled_amount,
      new_customers: mockDashboard.new_customers,
    }
  },
  getWeeklyStats: async () => {
    await delay()
    return mockWeeklyChart.map((w) => ({ label: w.day, count: w.count })) as WeeklyBookingStat[]
  },
  getNotifications: async () => {
    await delay()
    return mockNotifications.map((n) => ({
      id: n.id,
      title: n.type === 'BOOKING' ? '새 예약' : n.type === 'SETTLEMENT' ? '정산' : '리뷰',
      body: n.message,
      created_at: n.time,
      is_read: n.type === 'REVIEW',
    })) as Notification[]
  },
}

/** 30일 이상 미방문 고객 수 (영업 데모용) */
export function getLongTermAbsentCount(): number {
  const cutoff = new Date('2026-06-25')
  cutoff.setDate(cutoff.getDate() - 30)
  return mockCustomers.filter((c) => new Date(c.last_visit_at) < cutoff).length
}
