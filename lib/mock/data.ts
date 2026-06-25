import type {
  Booking, Business, BusinessHours, Coupon, Customer,
  DashboardSummary, Holiday, Notification, ServiceMenu,
  Settlement, Staff, WeeklyBookingStat,
} from '@/types'

export const mockBusiness: Business = {
  id: 1,
  name: '반짝반짝 손세차',
  slug: 'sparkle-wash',
  description: '원주 최고의 프리미엄 손세차',
  phone: '033-123-4567',
  address: '강원도 원주시 무실로 42',
  lat: 37.342,
  lng: 127.920,
  logo_url: '',
  banner_url: '',
  primary_color: '#1E40AF',
  booking_mode: 'AUTO',
  plan: 'BASIC',
  is_featured: true,
  service_types: ['CAR_WASH', 'DETAILING', 'COATING'],
  approval_status: 'APPROVED',
}

export const mockBookings: Booking[] = [
  {
    id: 1, booking_number: 'BK-20260624-001',
    user: { id: 1, name: '김철수', phone: '01012345678' },
    vehicle: { car_number: '12가3456', car_model: '쏘나타' },
    service_menu: { name: '기본 외부 세차', duration_minutes: 60 },
    staff: { id: 1, name: '박직원' },
    booking_date: '2026-06-24', booking_time: '09:00', price: 35000,
    status: 'CONFIRMED', memo: '', customer_request: '트렁크도 부탁드립니다',
    created_at: '2026-06-23T10:00:00',
  },
  {
    id: 2, booking_number: 'BK-20260624-002',
    user: { id: 2, name: '이영희', phone: '01098765432' },
    vehicle: { car_number: '34나7890', car_model: 'K5' },
    service_menu: { name: '실내+외부 풀세차', duration_minutes: 90 },
    staff: null,
    booking_date: '2026-06-24', booking_time: '10:30', price: 65000,
    status: 'PENDING', memo: '', customer_request: '',
    created_at: '2026-06-23T14:00:00',
  },
  {
    id: 3, booking_number: 'BK-20260624-003',
    user: { id: 3, name: '박민수', phone: '01055556666' },
    vehicle: { car_number: '56다1234', car_model: '그랜저' },
    service_menu: { name: '유리막 코팅', duration_minutes: 120 },
    staff: { id: 2, name: '최직원' },
    booking_date: '2026-06-24', booking_time: '14:00', price: 150000,
    status: 'IN_PROGRESS', memo: 'VIP 고객', customer_request: '',
    created_at: '2026-06-22T09:00:00',
  },
  {
    id: 4, booking_number: 'BK-20260624-004',
    user: { id: 4, name: '정우성', phone: '01077778888' },
    vehicle: { car_number: '78라5678', car_model: '아반떼' },
    service_menu: { name: '기본 외부 세차', duration_minutes: 60 },
    staff: null,
    booking_date: '2026-06-24', booking_time: '16:00', price: 30000,
    status: 'PENDING', memo: '', customer_request: '오후 4시 정각',
    created_at: '2026-06-24T08:00:00',
  },
  {
    id: 5, booking_number: 'BK-20260623-005',
    user: { id: 5, name: '최지은', phone: '01033334444' },
    vehicle: { car_number: '90마9012', car_model: '레이' },
    service_menu: { name: '기본 외부 세차', duration_minutes: 60 },
    staff: { id: 1, name: '박직원' },
    booking_date: '2026-06-23', booking_time: '11:00', price: 25000,
    status: 'COMPLETED', memo: '', customer_request: '',
    created_at: '2026-06-22T16:00:00',
  },
]

export const mockCustomers: Customer[] = [
  {
    user_id: 1, name: '김철수', phone: '01012345678', grade: 'VIP',
    visit_count: 12, total_spent: 480000, last_visit_at: '2026-06-20',
    next_recommended_visit: '2026-07-20',
    vehicles: [{ car_number: '12가3456', car_model: '쏘나타' }],
    memo: '매월 정기 방문',
  },
  {
    user_id: 2, name: '이영희', phone: '01098765432', grade: 'GOLD',
    visit_count: 8, total_spent: 320000, last_visit_at: '2026-06-15',
    next_recommended_visit: '2026-07-15',
    vehicles: [{ car_number: '34나7890', car_model: 'K5' }],
    memo: '',
  },
  {
    user_id: 3, name: '박민수', phone: '01055556666', grade: 'SILVER',
    visit_count: 5, total_spent: 180000, last_visit_at: '2026-05-10',
    next_recommended_visit: '2026-06-10',
    vehicles: [{ car_number: '56다1234', car_model: '그랜저' }],
    memo: '장기 미방문 주의',
  },
]

export const mockMenus: ServiceMenu[] = [
  {
    id: 1, service_type_code: 'CAR_WASH', name: '기본 외부 세차',
    description: '고압세척 + 폼클리닝 + 드라잉',
    duration_minutes: 60, base_price: 30000, is_active: true,
    distance_pricing: [
      { id: 1, distance_label: '근거리', max_distance_km: 5, price: 0 },
      { id: 2, distance_label: '중거리', max_distance_km: 15, price: 5000 },
    ],
  },
  {
    id: 2, service_type_code: 'CAR_WASH', name: '실내+외부 풀세차',
    description: '내부 진공 + 외부 세차 풀코스',
    duration_minutes: 90, base_price: 55000, is_active: true,
    distance_pricing: [],
  },
  {
    id: 3, service_type_code: 'COATING', name: '유리막 코팅',
    description: '프리미엄 유리막 코팅 1회',
    duration_minutes: 120, base_price: 150000, is_active: true,
    distance_pricing: [],
  },
]

export const mockSettlements: Settlement[] = [
  { date: '2026-06-24', booking_count: 4, total_sales: 280000, platform_fee: 14000, settled_amount: 266000, status: 'PENDING' },
  { date: '2026-06-23', booking_count: 6, total_sales: 420000, platform_fee: 21000, settled_amount: 399000, status: 'SETTLED' },
  { date: '2026-06-22', booking_count: 5, total_sales: 350000, platform_fee: 17500, settled_amount: 332500, status: 'SETTLED' },
]

export const mockCoupons: Coupon[] = [
  {
    id: 1, name: '신규 고객 5,000원 할인', discount_type: 'FIXED', discount_value: 5000,
    min_price: 30000, valid_from: '2026-06-01', valid_until: '2026-12-31',
    issue_type: 'MANUAL', issue_count: 50, use_count: 12, is_active: true,
  },
  {
    id: 2, name: '재방문 10% 할인', discount_type: 'PERCENT', discount_value: 10,
    min_price: 50000, valid_from: '2026-06-01', valid_until: '2026-09-30',
    issue_type: 'REVISIT', issue_count: 100, use_count: 28, is_active: true,
  },
]

export const mockStaff: Staff[] = [
  { id: 1, name: '박직원', is_active: true },
  { id: 2, name: '최직원', is_active: true },
  { id: 3, name: '김직원', is_active: false },
]

export const mockHours: BusinessHours[] = [
  { day: 0, label: '일', is_open: false, open_time: '09:00', close_time: '18:00' },
  { day: 1, label: '월', is_open: true, open_time: '09:00', close_time: '19:00' },
  { day: 2, label: '화', is_open: true, open_time: '09:00', close_time: '19:00' },
  { day: 3, label: '수', is_open: true, open_time: '09:00', close_time: '19:00' },
  { day: 4, label: '목', is_open: true, open_time: '09:00', close_time: '19:00' },
  { day: 5, label: '금', is_open: true, open_time: '09:00', close_time: '20:00' },
  { day: 6, label: '토', is_open: true, open_time: '09:00', close_time: '18:00' },
]

export const mockHolidays: Holiday[] = [
  { id: 1, date: '2026-08-15', reason: '광복절' },
  { id: 2, date: '2026-06-25', reason: '우천 휴무' },
]

export const mockNotifications: Notification[] = [
  { id: 1, title: '새 예약', body: '이영희님 10:30 예약이 접수되었습니다.', created_at: '2026-06-24T08:30:00', is_read: false },
  { id: 2, title: '정산 완료', body: '6월 23일 정산이 완료되었습니다.', created_at: '2026-06-24T07:00:00', is_read: false },
  { id: 3, title: '장기 미방문', body: '박민수님이 45일간 미방문입니다.', created_at: '2026-06-23T18:00:00', is_read: true },
]

export const mockDashboardSummary: DashboardSummary = {
  today_bookings: 4,
  month_sales: 5800000,
  unsettled_amount: 266000,
  new_customers: 12,
}

export const mockWeeklyStats: WeeklyBookingStat[] = [
  { label: '월', count: 8 },
  { label: '화', count: 6 },
  { label: '수', count: 9 },
  { label: '목', count: 7 },
  { label: '금', count: 11 },
  { label: '토', count: 5 },
  { label: '일', count: 0 },
]

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

export const mockApi = {
  getBusiness: async () => { await delay(); return mockBusiness },
  getBookings: async (filters?: { status?: string; date?: string }) => {
    await delay()
    let list = [...mockBookings]
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((b) => b.status === filters.status)
    }
    return list
  },
  getBooking: async (id: number) => {
    await delay()
    const b = mockBookings.find((x) => x.id === id)
    if (!b) throw new Error('Not found')
    return b
  },
  getCustomers: async () => { await delay(); return mockCustomers },
  getCustomer: async (id: number) => {
    await delay()
    const c = mockCustomers.find((x) => x.user_id === id)
    if (!c) throw new Error('Not found')
    return c
  },
  getMenus: async () => { await delay(); return mockMenus },
  getSettlements: async () => { await delay(); return mockSettlements },
  getCoupons: async () => { await delay(); return mockCoupons },
  getStaff: async () => { await delay(); return mockStaff },
  getHours: async () => { await delay(); return mockHours },
  getHolidays: async () => { await delay(); return mockHolidays },
  getDashboardSummary: async () => { await delay(); return mockDashboardSummary },
  getWeeklyStats: async () => { await delay(); return mockWeeklyStats },
  getNotifications: async () => { await delay(); return mockNotifications },
}
