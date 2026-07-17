'use client'

/**
 * Distributor Portal RBAC hook — completely separate from Admin RBAC
 * (hooks/useAdminPermissions.tsx). Do not merge these.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchDistributorMyPermissions,
  type DistributorMyPermissions,
} from '@/lib/distributor-api'
import { DISTRIBUTOR_MENU_REGISTRY, menuKeyForPath } from '@/lib/distributor-menu-registry'

export type PermissionKey = 'view' | 'edit' | 'delete' | 'approve' | 'download'

type PermFlags = {
  view: boolean
  edit: boolean
  delete: boolean
  approve: boolean
  download: boolean
}

type PermissionContextValue = {
  loaded: boolean
  staffRole: string | null
  staffRoleLabel: string | null
  isOwner: boolean
  distributorId: string | null
  passwordResetRequired: boolean
  canView: (menuKey: string) => boolean
  can: (menuKey: string, action: PermissionKey) => boolean
  refresh: () => Promise<void>
  firstAllowedHref: string | null
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

export function DistributorPermissionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DistributorMyPermissions | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetchDistributorMyPermissions()
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const map = useMemo(() => {
    const out = new Map<string, PermFlags>()
    if (!data) return out
    for (const p of data.permissions) {
      out.set(p.menuKey, {
        view: p.canView,
        edit: p.canEdit,
        delete: p.canDelete,
        approve: p.canApprove,
        download: p.canDownload,
      })
    }
    return out
  }, [data])

  const isOwner = Boolean(data?.isOwner)

  const can = useCallback(
    (menuKey: string, action: PermissionKey) => {
      if (!loaded) return false
      if (isOwner) return true
      const flags = map.get(menuKey)
      if (!flags) return false
      return Boolean(flags[action])
    },
    [loaded, isOwner, map],
  )

  const canView = useCallback((menuKey: string) => can(menuKey, 'view'), [can])

  const firstAllowedHref = useMemo(() => {
    if (!loaded) return null
    if (isOwner) return DISTRIBUTOR_MENU_REGISTRY[0]?.href ?? '/distributor'
    for (const m of DISTRIBUTOR_MENU_REGISTRY) {
      if (map.get(m.key)?.view) return m.href
    }
    return null
  }, [loaded, isOwner, map])

  const value: PermissionContextValue = {
    loaded,
    staffRole: data?.staffRole ?? null,
    staffRoleLabel: data?.staffRoleLabel ?? null,
    isOwner,
    distributorId: data?.distributorId ?? null,
    passwordResetRequired: Boolean(data?.passwordResetRequired),
    canView,
    can,
    refresh,
    firstAllowedHref,
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function useDistributorPermissions() {
  const ctx = useContext(PermissionContext)
  if (!ctx) {
    return {
      loaded: false,
      staffRole: null,
      staffRoleLabel: null,
      isOwner: false,
      distributorId: null,
      passwordResetRequired: false,
      canView: () => true,
      can: () => true,
      refresh: async () => undefined,
      firstAllowedHref: '/distributor',
    } satisfies PermissionContextValue
  }
  return ctx
}

export function useDistributorPermission(menuKey?: string | null) {
  const { can, canView, loaded, staffRole } = useDistributorPermissions()
  const key = menuKey ?? null
  return {
    loaded,
    staffRole,
    canView: key ? canView(key) : false,
    canEdit: key ? can(key, 'edit') : false,
    canDelete: key ? can(key, 'delete') : false,
    canApprove: key ? can(key, 'approve') : false,
    canDownload: key ? can(key, 'download') : false,
    can: (action: PermissionKey) => (key ? can(key, action) : false),
  }
}

export function useDistributorPathPermission() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  return useDistributorPermission(menuKeyForPath(pathname))
}
