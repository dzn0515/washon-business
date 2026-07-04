export type BookingStatus =
  | 'pending'
  | 'waiting'
  | 'confirmed'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'reviewed'
  | 'cancelled'
  | 'noshow'

export const BOOKING_STATUS_MAP: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '예약 접수', color: '#6B7280', bg: '#F3F4F6' },
  waiting: { label: '승인 대기', color: '#D97706', bg: '#FEF3C7' },
  confirmed: { label: '예약 확정', color: '#2563EB', bg: '#EFF6FF' },
  arrived: { label: '입차 완료', color: '#7C3AED', bg: '#F5F3FF' },
  in_progress: { label: '작업중', color: '#EA580C', bg: '#FFF7ED' },
  completed: { label: '작업 완료', color: '#059669', bg: '#ECFDF5' },
  paid: { label: '결제 완료', color: '#059669', bg: '#ECFDF5' },
  reviewed: { label: '리뷰 완료', color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { label: '취소', color: '#DC2626', bg: '#FEF2F2' },
  noshow: { label: '노쇼', color: '#DC2626', bg: '#FEF2F2' },
}

export const CATEGORY_LABELS: Record<string, string> = {
  wash: '세차',
  premium: '프리미엄',
  labor: '공임',
  tire_product: '타이어 상품',
  interior: '실내크리닝',
  detailing: '디테일링',
  construction: '시공',
  tint_product: '선팅 상품',
  installation_labor: '장착 공임',
  blackbox: '블랙박스',
  navi: '네비',
  maintenance: '정비',
  coating: '코팅',
  tire: '타이어',
  alignment: '얼라이먼트',
  oil: '오일교환',
  filter: '필터',
  battery: '배터리',
  repair: '복원',
  dent: '덴트·복원',
  glass: '유리복원',
  tinting: '썬팅·랩핑',
  audio: '블랙박스·카오디오',
  inspection: '점검',
}

export interface Vehicle {
  id: string
  license_plate: string
  brand?: string
  model?: string
  year?: number
  color?: string
  memo?: string
}

export interface VehicleRecord {
  id: string
  vehicle_id: string
  store_id: string
  service_type: string
  mileage?: number
  photos: string[]
  memo?: string
  next_service_date?: string
  created_at: string
}

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'CANCELLED'

export type PaymentMethod = 'ONSITE' | 'APP' | 'NONE'

export type CustomerGrade = 'NORMAL' | 'SILVER' | 'GOLD' | 'VIP'

export type ServiceTypeCode =
  | 'CAR_WASH' | 'DETAILING' | 'COATING' | 'TINTING' | 'POLISH' | 'WASH_SUBSCRIPTION'
  | 'TIRE' | 'WHEEL' | 'ALIGNMENT'
  | 'OIL_CHANGE' | 'REPAIR' | 'INSPECTION' | 'BATTERY' | 'AIRCON' | 'USED_CAR_INSPECTION'
  | 'BLACKBOX' | 'CAR_AUDIO' | 'ELECTRIC'
  | 'CAR_GLASS' | 'EMERGENCY_ROADSIDE'
  | 'INSURANCE' | 'ACCESSORY'

export interface Business {
  id: number
  name: string
  slug: string
  description: string
  phone: string
  address: string
  lat: number
  lng: number
  logo_url: string
  banner_url: string
  primary_color: string
  booking_mode: 'AUTO' | 'MANUAL'
  plan: 'FREE' | 'BASIC' | 'ENTERPRISE'
  is_featured: boolean
  service_types: ServiceTypeCode[]
  approval_status: 'PENDING' | 'APPROVED' | 'NONE'
}

export interface Booking {
  id: string | number
  booking_number: string
  user: { id: number; name: string; phone: string }
  vehicle: { car_number: string; car_model: string }
  service_menu: { name: string; duration_minutes: number }
  staff: { id: string | number; name: string; color?: string } | null
  bay: { id: string; name: string; number: number } | null
  booking_date: string
  booking_time: string
  price: number
  status: BookingStatus
  payment_method?: PaymentMethod
  payment_status?: PaymentStatus
  paid_amount?: number
  paid_at?: string | null
  memo: string
  customer_request: string
  created_at: string
}

export interface CustomerCar {
  car_number: string
  car_model: string
}

export interface Customer {
  user_id: number
  name: string
  phone: string
  grade: CustomerGrade
  visit_count: number
  total_spent: number
  last_visit_at: string
  next_recommended_visit: string
  vehicles: CustomerCar[]
  memo: string
}

export interface DistancePricing {
  id?: number
  distance_label: string
  max_distance_km: number | null
  price: number
}

export interface ServiceMenu {
  id: number
  service_type_code: ServiceTypeCode
  name: string
  description: string
  duration_minutes: number
  base_price: number
  distance_pricing: DistancePricing[]
  is_active: boolean
}

export interface Settlement {
  date: string
  booking_count: number
  total_sales: number
  platform_fee: number
  settled_amount: number
  status: 'PENDING' | 'SETTLED'
}

export interface Coupon {
  id: number
  name: string
  discount_type: 'FIXED' | 'PERCENT'
  discount_value: number
  min_price: number
  valid_from: string
  valid_until: string
  issue_type: 'MANUAL' | 'BIRTHDAY' | 'REVISIT' | 'LONGTERM'
  issue_count: number
  use_count: number
  is_active: boolean
}

export interface Staff {
  id: string | number
  name: string
  is_active: boolean
  color?: string
}

export interface BusinessStaff {
  id: string
  name: string
  phone: string
  position: string
  color: string
  sort_order: number
  is_active: boolean
}

export interface BusinessHours {
  day: number
  label: string
  is_open: boolean
  open_time: string
  close_time: string
}

export interface Holiday {
  id: number
  date: string
  reason: string
}

export interface BusinessBay {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export interface Notification {
  id: number
  title: string
  body: string
  created_at: string
  is_read: boolean
}

export interface DashboardSummary {
  today_bookings: number
  month_sales: number
  unsettled_amount: number
  new_customers: number
}

export interface WeeklyBookingStat {
  label: string
  count: number
}

export interface PlatformSettings {
  platformName: string
  contactEmail: string
  commissionRate: number
  basicPlanPrice: number
  proPlanPrice: number
  premiumPlanPrice: number
  freeTrialDays: number
  maintenanceMode: boolean
}

export type HealthStatus = 'healthy' | 'degraded' | 'down'

export interface SystemStatus {
  apiStatus: HealthStatus
  dbStatus: HealthStatus
  uptime: number
  version: string
  lastDeployAt: string
  activeConnections: number
}

export interface AdminLoginLog {
  id: string
  adminEmail: string
  ip: string
  userAgent: string
  success: boolean
  createdAt: string
}

export interface BlockedIp {
  id: string
  ip: string
  reason: string
  blockedAt: string
  blockedBy: string
}

// 내 업무
export interface WorkTodayStats {
  pendingApproval: number
  todayReservations: number
  unansweredInquiries: number
  newReviews: number
  alertCount: number
}

export interface UrgentTask {
  id: string
  priority: 'critical' | 'high' | 'medium'
  label: string
  count: number
  href: string
}

export interface TodaySchedule {
  id: string
  time: string
  title: string
}

export interface RecentWorkLog {
  id: string
  action: string
  target: string
  createdAt: string
}

export interface SystemStatusItem {
  name: string
  status: HealthStatus
}

export interface TodayDashboardStats {
  todayReservations: number
  todaySignups: number
  todayRevenue: number
  todayCancels: number
  todayReviews: number
}
