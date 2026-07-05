'use client'

import { createContext, useContext, useEffect, useMemo } from 'react'
import { demoHref, setDemoModeActive } from '@/lib/demo-mode'

type DemoModeContextValue = {
  isDemo: boolean
  href: (path: string) => string
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemo: false,
  href: (path) => path,
})

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setDemoModeActive(true)
    return () => setDemoModeActive(false)
  }, [])

  const value = useMemo(
    () => ({
      isDemo: true,
      href: demoHref,
    }),
    [],
  )

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
}

export function useDemoMode(): DemoModeContextValue {
  return useContext(DemoModeContext)
}
