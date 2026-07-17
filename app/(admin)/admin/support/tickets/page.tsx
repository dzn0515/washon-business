'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminBadge from '@/components/admin/AdminBadge'
import { useToast } from '@/components/admin/AdminToast'
import { PermissionGate } from '@/components/admin/PermissionGate'
import {
  adminAssignTicket,
  adminCloseTicket,
  adminFetchTicket,
  adminFetchTickets,
  adminPatchTicket,
  adminReplyTicket,
  adminResolveTicket,
  type SupportTicketDetail,
  type SupportTicketListItem,
} from '@/lib/support-api'

const STATUS_LABEL: Record<string, string> = {
  OPEN: '접수',
  ASSIGNED: '배정',
  WAITING_ADMIN: '답변대기',
  WAITING_REQUESTER: '고객대기',
  RESOLVED: '처리완료',
  CLOSED: '종료',
}

export default function AdminSupportTicketsPage() {
  const { showToast, ToastComponent } = useToast()
  const [items, setItems] = useState<SupportTicketListItem[]>([])
  const [kpi, setKpi] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [channel, setChannel] = useState('all')
  const [status, setStatus] = useState('all')
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null)
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminFetchTickets({
        search: search || undefined,
        channel: channel === 'all' ? undefined : channel,
        status: status === 'all' ? undefined : status,
        pageSize: 50,
      })
      setItems(data.items)
      setKpi(data.kpi || {})
    } catch (e) {
      showToast(e instanceof Error ? e.message : '목록 로드 실패', 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [search, channel, status, showToast])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (id: string) => {
    try {
      setDetail(await adminFetchTicket(id))
      setReply('')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '상세 로드 실패', 'error')
    }
  }

  const sendReply = async () => {
    if (!detail || !reply.trim() || busy) return
    setBusy(true)
    try {
      const next = await adminReplyTicket(
        detail.id,
        reply.trim(),
        internal ? 'INTERNAL_NOTE' : 'PUBLIC_REPLY',
      )
      setDetail(next)
      setReply('')
      showToast(internal ? '내부 메모가 저장되었습니다.' : '답변이 등록되었습니다.', 'success')
      void load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '답변 실패', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader title="문의관리" description="통합 운영센터 티켓 처리" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['미처리', kpi.openCount],
          ['미배정', kpi.unassignedCount],
          ['답변대기', kpi.waitingAdminCount],
          ['긴급', kpi.urgentCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-white p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-2xl font-semibold mt-1">{value ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="티켓번호·제목 검색"
          className="border rounded-lg px-3 py-2 text-sm w-56"
        />
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">전체 채널</option>
          <option value="CUSTOMER">고객</option>
          <option value="OWNER">업체</option>
          <option value="SALES">영업</option>
          <option value="DISTRIBUTOR">총판</option>
          <option value="AGENCY">영업점</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">전체 상태</option>
          {Object.keys(STATUS_LABEL).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void load()} className="px-3 py-2 text-sm border rounded-lg">
          새로고침
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-gray-500">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">문의가 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">티켓</th>
                <th className="px-3 py-2">채널</th>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">우선순위</th>
                <th className="px-3 py-2">담당</th>
                <th className="px-3 py-2">최근</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={it.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => void openDetail(it.id)}
                >
                  <td className="px-3 py-2 font-mono text-xs">{it.ticketNo}</td>
                  <td className="px-3 py-2">{it.channel}</td>
                  <td className="px-3 py-2">{it.subject}</td>
                  <td className="px-3 py-2">
                    <AdminBadge variant="info" label={STATUS_LABEL[it.status] || it.status} />
                  </td>
                  <td className="px-3 py-2">{it.priority}</td>
                  <td className="px-3 py-2">{it.assignee || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {(it.lastMessageAt || it.createdAt || '').slice(0, 16).replace('T', ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setDetail(null)}>
          <div
            className="w-full max-w-xl h-full bg-white shadow-xl p-5 overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-xs font-mono text-gray-500">{detail.ticketNo}</div>
                <h2 className="text-lg font-semibold">{detail.subject}</h2>
                <div className="text-xs text-gray-500 mt-1">
                  {detail.channel} · {STATUS_LABEL[detail.status] || detail.status} · {detail.priority}
                </div>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="text-sm text-gray-500">
                닫기
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <PermissionGate menuKey="support" action="edit">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs border rounded-lg"
                  onClick={async () => {
                    setDetail(await adminAssignTicket(detail.id))
                    void load()
                  }}
                >
                  나에게 배정
                </button>
              </PermissionGate>
              <PermissionGate menuKey="support" action="edit">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs border rounded-lg"
                  onClick={async () => {
                    setDetail(await adminPatchTicket(detail.id, { priority: 'URGENT' }))
                    void load()
                  }}
                >
                  긴급
                </button>
              </PermissionGate>
              <PermissionGate menuKey="support" action="edit">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs border rounded-lg"
                  onClick={async () => {
                    setDetail(await adminResolveTicket(detail.id))
                    void load()
                  }}
                >
                  처리완료
                </button>
              </PermissionGate>
              <PermissionGate menuKey="support" action="edit">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs border rounded-lg"
                  onClick={async () => {
                    setDetail(await adminCloseTicket(detail.id))
                    void load()
                  }}
                >
                  종료
                </button>
              </PermissionGate>
            </div>

            <div className="space-y-3 border rounded-xl p-3 max-h-80 overflow-y-auto bg-gray-50">
              {detail.messages?.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-3 text-sm ${
                    m.messageType === 'INTERNAL_NOTE'
                      ? 'bg-amber-50 border border-amber-100'
                      : m.senderType === 'ADMIN'
                        ? 'bg-blue-50'
                        : 'bg-white border'
                  }`}
                >
                  <div className="text-[11px] text-gray-500 mb-1">
                    {m.senderType} · {m.messageType} · {(m.createdAt || '').slice(0, 16).replace('T', ' ')}
                  </div>
                  <div className="whitespace-pre-wrap">{m.message}</div>
                  {m.attachments?.map((a) => (
                    <a
                      key={a.id}
                      href={a.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-blue-600 mt-2"
                    >
                      {a.originalFilename}
                    </a>
                  ))}
                </div>
              ))}
            </div>

            <PermissionGate menuKey="support" action="edit">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  내부 메모 (사용자 비노출)
                </label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg p-3 text-sm"
                  placeholder="답변 내용"
                />
                <button
                  type="button"
                  disabled={busy || !reply.trim()}
                  onClick={() => void sendReply()}
                  className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
                >
                  {busy ? '전송 중…' : '등록'}
                </button>
              </div>
            </PermissionGate>
          </div>
        </div>
      )}
    </div>
  )
}
