'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { fetchMyTicket, replyMyTicket, type SupportTicketDetail } from '@/lib/support-api'

export default function OwnerSupportTicketDetailPage() {
  const params = useParams<{ ticketNo: string }>()
  const ticketNo = params.ticketNo
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setTicket(await fetchMyTicket(ticketNo))
    } catch (e) {
      setError(e instanceof Error ? e.message : '로드 실패')
    }
  }, [ticketNo])

  useEffect(() => {
    void load()
  }, [load])

  const send = async () => {
    if (!ticket?.canMessage || busy || !message.trim()) return
    setBusy(true)
    try {
      setTicket(await replyMyTicket(ticketNo, message.trim()))
      setMessage('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '전송 실패')
    } finally {
      setBusy(false)
    }
  }

  if (!ticket && !error) return <div className="p-6 text-sm text-gray-500">불러오는 중…</div>

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ticket && (
        <>
          <div>
            <div className="text-xs font-mono text-gray-500">{ticket.ticketNo}</div>
            <h1 className="text-xl font-semibold">{ticket.subject}</h1>
            <div className="text-xs text-gray-500 mt-1">
              {ticket.status} · {ticket.categoryName}
            </div>
          </div>
          <div className="space-y-3">
            {ticket.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl p-3 text-sm ${
                  m.senderType === 'ADMIN' ? 'bg-blue-50' : 'bg-white border'
                }`}
              >
                <div className="text-[11px] text-gray-500 mb-1">
                  {m.senderType} · {(m.createdAt || '').slice(0, 16).replace('T', ' ')}
                </div>
                <div className="whitespace-pre-wrap">{m.message}</div>
              </div>
            ))}
          </div>
          {ticket.canMessage ? (
            <div className="space-y-2">
              <textarea
                className="w-full border rounded-lg p-3 text-sm"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="추가 문의"
              />
              <button
                type="button"
                disabled={busy || !message.trim()}
                onClick={() => void send()}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
              >
                {busy ? '전송 중…' : '메시지 보내기'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">종료된 문의에는 메시지를 추가할 수 없습니다.</p>
          )}
        </>
      )}
    </div>
  )
}
