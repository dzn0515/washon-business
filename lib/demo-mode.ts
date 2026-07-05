export function isDemoPath(pathname: string): boolean {
  return pathname === '/demo' || pathname.startsWith('/demo/')
}

let demoModeActive = false

export function setDemoModeActive(active: boolean): void {
  demoModeActive = active
}

export function isDemoMode(): boolean {
  if (demoModeActive) return true
  if (typeof window !== 'undefined') {
    return isDemoPath(window.location.pathname)
  }
  return false
}

/** @deprecated use isDemoMode */
export const getDemoModeActive = isDemoMode

export function demoHref(path: string): string {
  if (path.startsWith('/demo')) return path
  if (path.startsWith('/dashboard')) return path.replace(/^\/dashboard/, '/demo')
  if (path.startsWith('/bookings')) return '/demo/reservations'
  if (path.startsWith('/customers')) return path.replace(/^\/customers/, '/demo/customers')
  return path
}

export class DemoModeError extends Error {
  constructor() {
    super('Demo mode: API calls are disabled')
    this.name = 'DemoModeError'
  }
}
