export type BusinessStatus = 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected'

export type MockBusiness = {
  id: string
  name: string
  ownerName: string
  email: string
  phone: string
  businessNumber: string
  address: string
  region: string
  type: string
  bizType?: string
  bays: number
  appliedAt: string
  approvedAt?: string
  status: BusinessStatus
  subscription?: string
  maintenancePaid?: boolean
}

export const mockPendingBusinesses: MockBusiness[] = [
  {
    id: '1',
    name: '클린카 세차장',
    ownerName: '박민준',
    email: 'park@example.com',
    phone: '010-2345-6789',
    businessNumber: '234-56-78901',
    address: '서울시 강남구 테헤란로 123',
    region: '서울',
    type: '손세차',
    bizType: 'wash',
    bays: 2,
    appliedAt: '2026-06-24',
    status: 'pending',
  },
  {
    id: '2',
    name: '프리미엄 디테일링',
    ownerName: '이수진',
    email: 'lee@example.com',
    phone: '010-3456-7890',
    businessNumber: '345-67-89012',
    address: '경기도 수원시 영통구 광교로 45',
    region: '경기',
    type: '디테일링',
    bizType: 'detailing',
    bays: 4,
    appliedAt: '2026-06-23',
    status: 'pending',
  },
  {
    id: '3',
    name: '스피드 자동세차',
    ownerName: '최현우',
    email: 'choi@example.com',
    phone: '010-4567-8901',
    businessNumber: '456-78-90123',
    address: '부산시 해운대구 우동 123',
    region: '부산',
    type: '자동세차',
    bizType: 'wash',
    bays: 6,
    appliedAt: '2026-06-22',
    status: 'pending',
  },
]

export const mockApprovedBusinesses: MockBusiness[] = [
  {
    id: '4',
    name: '반짝반짝 손세차',
    ownerName: '김사장',
    email: 'owner@washon.kr',
    phone: '010-1234-5678',
    businessNumber: '123-45-67890',
    address: '강원도 원주시 무실로 42',
    region: '강원',
    type: '손세차',
    bays: 3,
    appliedAt: '2026-05-28',
    approvedAt: '2026-06-01',
    status: 'active',
    subscription: 'Basic',
    maintenancePaid: true,
  },
  {
    id: '5',
    name: '워시존 강남점',
    ownerName: '정하늘',
    email: 'jung@example.com',
    phone: '010-5678-9012',
    businessNumber: '567-89-01234',
    address: '서울시 강남구 역삼동 88',
    region: '서울',
    type: '자동세차',
    bays: 8,
    appliedAt: '2026-04-10',
    approvedAt: '2026-04-12',
    status: 'active',
    subscription: 'Pro',
    maintenancePaid: true,
  },
]

export const mockRejectedBusinesses: MockBusiness[] = [
  {
    id: '6',
    name: '미등록 세차소',
    ownerName: '한지우',
    email: 'han@example.com',
    phone: '010-6789-0123',
    businessNumber: '678-90-12345',
    address: '인천시 남동구 구월동 12',
    region: '인천',
    type: '기타',
    bays: 1,
    appliedAt: '2026-06-10',
    status: 'rejected',
  },
]

export const mockAllBusinesses: MockBusiness[] = [
  ...mockPendingBusinesses,
  ...mockApprovedBusinesses,
  ...mockRejectedBusinesses,
]

export const mockStats = {
  totalBusinesses: 284,
  newThisMonth: 12,
  pendingCount: 3,
  monthlyRevenue: 58_400_000,
  maintenanceFeeRevenue: 8_120_000,
  maintenanceFeePerBusiness: 28_000,
  revenueGrowthPercent: 12,
  adRevenue: 1_250_000,
  bookingFeeRevenue: 0,
}

export const mockRecentBusinesses = [
  { name: '클린카 세차장', owner: '박민준', appliedAt: '2026-06-24', status: 'pending' as const },
  { name: '프리미엄 디테일링', owner: '이수진', appliedAt: '2026-06-23', status: 'pending' as const },
  { name: '스피드 자동세차', owner: '최현우', appliedAt: '2026-06-22', status: 'pending' as const },
  { name: '반짝반짝 손세차', owner: '김사장', appliedAt: '2026-06-01', status: 'active' as const },
  { name: '워시존 강남점', owner: '정하늘', appliedAt: '2026-04-12', status: 'active' as const },
]

export const mockMonthlySignupTrend = [
  { month: '1월', count: 18 },
  { month: '2월', count: 22 },
  { month: '3월', count: 25 },
  { month: '4월', count: 31 },
  { month: '5월', count: 28 },
  { month: '6월', count: 12 },
]

export const mockUsers = [
  { id: 'u1', name: '김사장', email: 'owner@washon.kr', phone: '010-1234-5678', role: 'owner', joinedAt: '2026-01-15', status: 'active', business: '반짝반짝 손세차' },
  { id: 'u2', name: '박민준', email: 'park@example.com', phone: '010-2345-6789', role: 'owner', joinedAt: '2026-06-24', status: 'pending', business: '클린카 세차장' },
  { id: 'u3', name: '이고객', email: 'customer@example.com', phone: '010-9999-8888', role: 'customer', joinedAt: '2026-03-20', status: 'active', business: '-' },
  { id: 'u4', name: '슈퍼어드민', email: 'admin@washon.kr', phone: '010-0000-0000', role: 'admin', joinedAt: '2025-12-01', status: 'active', business: '-' },
]

export const mockUserStats = {
  total: 1284,
  owners: 284,
  customers: 1000,
  newThisMonth: 45,
}

export const mockRevenueRows = [
  { date: '2026-06-24', business: '반짝반짝 손세차', item: '앱 노출 유지비', amount: 28_000, status: '완료' },
  { date: '2026-06-24', business: '워시존 강남점', item: '앱 노출 유지비', amount: 28_000, status: '완료' },
  { date: '2026-06-23', business: '워시존 강남점', item: '검색 상단 고정', amount: 30_000, status: '완료' },
  { date: '2026-06-22', business: '반짝반짝 손세차', item: '홈 추천 매장', amount: 50_000, status: '완료' },
  { date: '2026-06-20', business: '클린카 세차장', item: '앱 노출 유지비', amount: 28_000, status: '미정산' },
]

export const mockBusinessRevenue = [
  { name: '반짝반짝 손세차', bookings: 142, revenue: 4_260_000, maintenancePaid: true, status: '운영중' },
  { name: '워시존 강남점', bookings: 218, revenue: 6_540_000, maintenancePaid: true, status: '운영중' },
  { name: '클린카 세차장', bookings: 0, revenue: 0, maintenancePaid: false, status: '승인대기' },
]

export const mockMonthlyRevenueTrend = [
  { month: '1월', amount: 42_000_000 },
  { month: '2월', amount: 45_500_000 },
  { month: '3월', amount: 48_200_000 },
  { month: '4월', amount: 52_100_000 },
  { month: '5월', amount: 52_100_000 },
  { month: '6월', amount: 58_400_000 },
]

export const mockSettlement = { pending: 3, completed: 281 }

export const mockAdProducts = [
  { name: '기본 노출 (앱 노출 유지비)', active: 284, revenue: 7_952_000, price: 28_000 },
  { name: '검색 상단 고정', active: 12, revenue: 360_000, price: 30_000 },
  { name: '홈 추천 매장', active: 8, revenue: 400_000, price: 50_000 },
  { name: '신규 부스팅', active: 5, revenue: 100_000, price: 20_000 },
]

export const mockAdApplications = [
  { business: '워시존 강남점', product: '검색 상단 고정', period: '2026.06.01 ~ 06.30', amount: 30_000, status: '활성' },
  { business: '반짝반짝 손세차', product: '홈 추천 매장', period: '2026.06.15 ~ 07.14', amount: 50_000, status: '활성' },
  { business: '클린카 세차장', product: '신규 부스팅', period: '2026.06.20 ~ 07.19', amount: 20_000, status: '대기' },
]

export const mockNotificationHistory = [
  { sentAt: '2026-06-24 10:00', target: '전체 사장님', channel: '앱 알림', title: '6월 정산 안내', received: 284, read: 198 },
  { sentAt: '2026-06-20 14:30', target: '승인 대기', channel: '알림톡', title: '가입 서류 보완 요청', received: 3, read: 3 },
  { sentAt: '2026-06-15 09:00', target: '전체 사장님', channel: '이메일', title: '여름 시즌 프로모션', received: 281, read: 156 },
]

export const mockSystemSettings = {
  maintenanceFee: 28_000,
  freeTrialDays: 90,
  bookingFeeRate: 0,
  noShowDeposit: 5_000,
  adPrices: {
    searchTop: 30_000,
    homeFeatured: 50_000,
    newBoost: 20_000,
    brandKeyword: 40_000,
  },
}

export const mockSystemStatus = [
  { name: 'API 서버', status: 'ok' as const, detail: 'api.autoon.kr' },
  { name: 'DB', status: 'ok' as const, detail: '정상' },
  { name: '알림톡', status: 'warn' as const, detail: '데모 모드' },
  { name: '결제', status: 'error' as const, detail: '미연동 (Phase 3)' },
]

export const STATUS_LABEL: Record<BusinessStatus, string> = {
  pending: '승인대기',
  active: '운영중',
  inactive: '비활성',
  suspended: '정지',
  rejected: '거절됨',
}

export const REGIONS = ['전체', '서울', '경기', '강원', '부산', '인천']
