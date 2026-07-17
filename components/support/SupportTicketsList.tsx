'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchMyTickets, type SupportTicketListItem } from '@/lib/support-api'

const STATUS: Record<string, string> = {
  OPEN: '접수',
  ASSIGNED: '배정',
  WAITING_ADMIN: '답변대기',
  WAITING_REQUESTER: '답변도착',
  RESOLVED: '처리완료',
  CLOSED: '종료',
}

export default function SupportTicketsList({
  basePath,
}: {
  basePath: string
}) {
  const [items, setItems] = useState<SupportTicketListItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyTickets()
      .then((d) => setItems(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : '로드 실패'))
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">문의내역</h1>
        <Link href={`${basePath}/new`} className="text-sm text-blue-600">
          새 문의
        </Link>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        {items.map((it) => (
          <Link
            key={it.id}
            href={`${basePath}/tickets/${it.ticketNo}`}
            className="block border rounded-xl bg-white p-4 hover:border-blue-300"
          >
            <div className="flex justify-between text-xs text-gray-500">
              <span className="font-mono">{it.ticketNo}</span>
              <span>{STATUS[it.status] || it.status}</span>
            </div>
            <div className="font-medium mt-1">{it.subject}</div>
          </Link>
        ))}
        {!error && items.length === 0 && (
          <p className="text-sm text-gray-500">문의 내역이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
