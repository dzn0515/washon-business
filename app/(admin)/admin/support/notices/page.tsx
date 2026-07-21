'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useToast } from '@/components/admin/AdminToast'
import { PermissionGate } from '@/components/admin/PermissionGate'
import {
  adminEndNotice,
  adminFetchNotices,
  adminPublishNotice,
  adminSaveNotice,
  adminSendExpoPush,
} from '@/lib/support-api'

export default function AdminSupportNoticesPage() {
  const { showToast, ToastComponent } = useToast()
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [form, setForm] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    isImportant: false,
    isPopup: false,
  })

  const load = useCallback(async () => {
    try {
      setItems(await adminFetchNotices())
    } catch (e) {
      showToast(e instanceof Error ? e.message : '공지 로드 실패', 'error')
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const create = async () => {
    try {
      const created = (await adminSaveNotice({
        ...form,
        status: 'DRAFT',
      })) as { id: string }
      const published = (await adminPublishNotice(created.id)) as {
        id?: string
        push?: { status?: string; sent_count?: number; fail_count?: number }
      }
      const push = published.push
      if (push?.status === 'SENT') {
        showToast(`공지 게시 + 푸시 발송 (${push.sent_count ?? 0}건)`, 'success')
      } else if (push?.status === 'SKIPPED') {
        showToast('공지가 게시되었습니다. (고객 앱 푸시 대상 아님)', 'success')
      } else if (push?.status === 'FAILED' || push?.status === 'ERROR') {
        showToast('공지는 게시됐으나 푸시 발송에 실패했습니다.', 'error')
      } else {
        showToast('공지가 게시되었습니다.', 'success')
      }
      setForm({ title: '', content: '', audience: 'ALL', isImportant: false, isPopup: false })
      void load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '게시 실패', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader
        title="공지사항"
        description="게시 시 고객 앱(Expo) 푸시가 ALL/CUSTOMER 대상에 발송됩니다"
      />

      <PermissionGate menuKey="announcements" action="edit">
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
          >
            {['ALL', 'CUSTOMER', 'OWNER', 'SALES', 'DISTRIBUTOR', 'AGENCY'].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={5}
            placeholder="내용 (plain text)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isImportant}
                onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
              />
              중요
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPopup}
                onChange={(e) => setForm({ ...form, isPopup: e.target.checked })}
              />
              팝업
            </label>
          </div>
          <button type="button" onClick={() => void create()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
            작성 후 게시·푸시 발송
          </button>
        </div>
      </PermissionGate>

      <div className="bg-white border rounded-xl divide-y">
        {items.map((n) => (
          <div key={String(n.id)} className="p-4 flex justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">
                {String(n.audience)} · {String(n.status)}
                {n.isImportant ? ' · 중요' : ''}
                {n.isPopup ? ' · 팝업' : ''}
              </div>
              <div className="font-medium">{String(n.title)}</div>
              <div className="text-sm text-gray-600 whitespace-pre-wrap mt-1">{String(n.content)}</div>
            </div>
            <div className="flex flex-col gap-2 h-fit">
              {n.status === 'PUBLISHED' && (n.audience === 'ALL' || n.audience === 'CUSTOMER') && (
                <PermissionGate menuKey="announcements" action="edit">
                  <button
                    type="button"
                    className="text-xs border rounded px-2 py-1"
                    onClick={async () => {
                      try {
                        const res = await adminSendExpoPush({
                          title: String(n.title),
                          body: String(n.content),
                          noticeId: Number(n.id),
                          deepLink: `autoon://support/notice/${n.id}`,
                          audience: String(n.audience),
                        })
                        showToast(
                          `푸시 재발송: ${String(res.status)} (sent ${String(res.sent_count ?? 0)})`,
                          res.status === 'SENT' ? 'success' : 'error',
                        )
                      } catch (e) {
                        showToast(e instanceof Error ? e.message : '푸시 실패', 'error')
                      }
                    }}
                  >
                    푸시 재발송
                  </button>
                </PermissionGate>
              )}
              {n.status === 'PUBLISHED' && (
                <PermissionGate menuKey="announcements" action="approve">
                  <button
                    type="button"
                    className="text-xs border rounded px-2 py-1"
                    onClick={async () => {
                      await adminEndNotice(String(n.id))
                      void load()
                    }}
                  >
                    종료
                  </button>
                </PermissionGate>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
