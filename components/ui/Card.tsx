import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export default function Card({ children, className, title }: CardProps) {
  return (
    <div className={cn('bg-white border border-gray-100 rounded-card p-4', className)}>
      {title && <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>}
      {children}
    </div>
  )
}
