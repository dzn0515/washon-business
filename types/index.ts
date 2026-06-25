export type BookingStatus =
  | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

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
  id: number
  booking_number: string
  user: { id: number; name: string; phone: string }
  vehicle: { car_number: string; car_model: string }
  service_menu: { name: string; duration_minutes: number }
  staff: { id: number; name: string } | null
  booking_date: string
  booking_time: string
  price: number
  status: BookingStatus
  memo: string
  customer_request: string
  created_at: string
}

export interface Vehicle {
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
  vehicles: Vehicle[]
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
  id: number
  name: string
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
