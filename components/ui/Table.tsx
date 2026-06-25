import { cn } from '@/lib/utils'

interface TableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export default function Table({ headers, children, className }: TableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {headers.map((h) => (
              <th key={h} className="text-left text-gray-400 font-medium py-2 px-2 first:pl-0 last:pr-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
