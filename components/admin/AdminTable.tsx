import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Column {
  key: string
  label: string
  width?: string
}

interface AdminTableProps {
  columns: Column[]
  data: Record<string, ReactNode>[]
  loading?: boolean
  onRowClick?: (row: Record<string, ReactNode>) => void
  emptyMessage?: string
}

export default function AdminTable({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = '데이터가 없습니다.',
}: AdminTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-gray-400 font-medium py-3 px-4"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">{emptyMessage}</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-gray-400 font-medium py-3 px-4"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={cn(
                'border-b border-gray-50 last:border-0',
                onRowClick && 'cursor-pointer hover:bg-gray-50',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-gray-700">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
