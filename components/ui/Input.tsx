import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none',
        'focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
export default Input
