import { cn } from '@/lib/utils'

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
} as const

const CHANGE_COLOR = {
  up: 'text-green-600 bg-green-50',
  down: 'text-red-600 bg-red-50',
  neutral: 'text-gray-500 bg-gray-100',
} as const

interface AdminStatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon?: string
  color?: keyof typeof COLOR_MAP
}

export default function AdminStatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'blue',
}: AdminStatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        {icon && (
          <span
            className={cn(
              'text-xl w-10 h-10 flex items-center justify-center rounded-lg',
              COLOR_MAP[color],
            )}
          >
            {icon}
          </span>
        )}
        {change && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              CHANGE_COLOR[changeType],
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
