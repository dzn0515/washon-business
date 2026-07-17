'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { fetchMyTicket, replyMyTicket, type SupportTicketDetail } from '@/lib/support-api'

export default function SalesSupportTicketDetailPage() {
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

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ticket && (
        <>
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <div className="text-xs font-mono text-gray-500">{ticket.ticketNo}</div>
          <div className="space-y-3">
            {ticket.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl p-3 text-sm ${m.senderType === 'ADMIN' ? 'bg-blue-50' : 'bg-white border'}`}
              >
                <div className="whitespace-pre-wrap">{m.message}</div>
              </div>
            ))}
          </div>
          {ticket.canMessage && (
            <div className="space-y-2">
              <textarea
                className="w-full border rounded-lg p-3 text-sm"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || !message.trim()}
                onClick={() => void send()}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
              >
                보내기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
