import { ADMIN_MENUS } from '@/components/admin/AdminSidebar'

export type PermissionKey = 'read' | 'update' | 'delete' | 'approve' | 'download'

export interface MenuPermission {
  read: boolean
  update: boolean
  delete: boolean
  approve: boolean
  download: boolean
}

export type RolePermissionMap = Record<string, MenuPermission>

export const ADMIN_ROLES = [
  { key: 'SUPER_ADMIN', label: '최고관리자', color: 'purple', fixed: true },
  { key: 'ADMIN', label: '운영관리자', color: 'blue', fixed: false },
  { key: 'FINANCE', label: '정산관리자', color: 'green', fixed: false },
  { key: 'CS', label: 'CS관리자', color: 'orange', fixed: false },
  { key: 'SALES', label: '영업관리자', color: 'indigo', fixed: false },
  { key: 'PARTNER', label: '총판관리자', color: 'teal', fixed: false },
  { key: 'VIEWER', label: '읽기전용', color: 'gray', fixed: false },
] as const

export type AdminRoleKey = (typeof ADMIN_ROLES)[number]['key']

export const ALL_PERMISSIONS = ADMIN_MENUS.flatMap((s) => s.items)
  .map((i) => i.permission)
  .filter(Boolean) as string[]

const ALL_TRUE: MenuPermission = {
  read: true,
  update: true,
  delete: true,
  approve: true,
  download: true,
}
const READ_ONLY: MenuPermission = {
  read: true,
  update: false,
  delete: false,
  approve: false,
  download: true,
}
const READ_EDIT: MenuPermission = {
  read: true,
  update: true,
  delete: false,
  approve: false,
  download: true,
}
const READ_APPR: MenuPermission = {
  read: true,
  update: true,
  delete: false,
  approve: true,
  download: true,
}

export const DEFAULT_PERMISSIONS: Record<AdminRoleKey, RolePermissionMap> = {
  SUPER_ADMIN: Object.fromEntries(ALL_PERMISSIONS.map((p) => [p, { ...ALL_TRUE }])),
  ADMIN: {
    'dashboard.read': READ_ONLY,
    'business.read': READ_APPR,
    'reservation.read': READ_EDIT,
    'cs.read': READ_EDIT,
    'notices.read': READ_EDIT,
    'review.read': READ_APPR,
    'stats.read': READ_ONLY,
    'qr.read': READ_ONLY,
    'roles.read': READ_ONLY,
    'settings.read': READ_EDIT,
    'system.read': READ_ONLY,
    'security.read': READ_EDIT,
  },
  FINANCE: {
    'payment.read': READ_APPR,
    'finance.read': READ_ONLY,
    'stats.read': READ_ONLY,
  },
  CS: {
    'cs.read': READ_EDIT,
    'review.read': READ_APPR,
    'customer.read': READ_ONLY,
  },
  SALES: {
    'business.read': READ_APPR,
    'sales.read': READ_EDIT,
    'screening.read': READ_APPR,
  },
  PARTNER: {
    'business.read': READ_ONLY,
    'sales.read': READ_ONLY,
  },
  VIEWER: Object.fromEntries(ALL_PERMISSIONS.map((p) => [p, { ...READ_ONLY }])),
}
