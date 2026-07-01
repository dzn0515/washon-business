'use client'

import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function Field({ label, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}

interface VisibilityToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function VisibilityToggle({ checked, onChange, label = '노출' }: VisibilityToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
            checked && 'translate-x-4'
          )}
        />
      </button>
      <span className="text-xs text-gray-600">{label}</span>
    </label>
  )
}
