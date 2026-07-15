'use client'

import type { ReactNode } from 'react'
import { usePermission } from '@/hooks/useAdminPermissions'
import type { PermissionKey } from '@/lib/admin-permissions'

export function PermissionGate({
  menuKey,
  action = 'view',
  children,
  fallback = null,
}: {
  menuKey: string
  action?: PermissionKey
  children: ReactNode
  fallback?: ReactNode
}) {
  const { can, loaded } = usePermission(menuKey)
  if (!loaded) return null
  if (!can(action)) return <>{fallback}</>
  return <>{children}</>
}

export function PermissionButton({
  menuKey,
  action,
  children,
  className,
  disabled,
  onClick,
  type = 'button',
}: {
  menuKey: string
  action: PermissionKey
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  const { can, loaded } = usePermission(menuKey)
  if (!loaded || !can(action)) return null
  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
