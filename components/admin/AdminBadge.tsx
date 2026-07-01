import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const VARIANT_STYLES = {
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
} as const

interface AdminBadgeProps {
  label: string
  variant: keyof typeof VARIANT_STYLES
}

export default function AdminBadge({ label, variant }: AdminBadgeProps) {
  return <Badge className={cn(VARIANT_STYLES[variant])}>{label}</Badge>
}
