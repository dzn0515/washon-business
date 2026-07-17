'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useToast } from '@/components/admin/AdminToast'
import { PermissionGate } from '@/components/admin/PermissionGate'
import {
  adminDeleteFaq,
  adminFetchCategories,
  adminFetchFaqs,
  adminSaveFaq,
} from '@/lib/support-api'

export default function AdminSupportFaqsPage() {
  const { showToast, ToastComponent } = useToast()
  const [items, setItems] = useState<Array<Record<string, unknown>>>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [form, setForm] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    categoryId: '',
    isPublished: true,
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [faqs, cats] = await Promise.all([adminFetchFaqs(), adminFetchCategories()])
      setItems(faqs)
      setCategories(cats)
      if (!form.categoryId && cats[0]) setForm((f) => ({ ...f, categoryId: cats[0].id }))
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'FAQ 로드 실패', 'error')
    }
  }, [form.categoryId, showToast])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    try {
      await adminSaveFaq(
        {
          title: form.title,
          content: form.content,
          audience: form.audience,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          isPublished: form.isPublished,
        },
        editingId || undefined,
      )
      showToast('저장되었습니다.', 'success')
      setEditingId(null)
      setForm({ title: '', content: '', audience: 'ALL', categoryId: categories[0]?.id || '', isPublished: true })
      void load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장 실패', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <AdminPageHeader title="FAQ 관리" description="채널별 FAQ 게시" />

      <PermissionGate menuKey="support_faqs" action="edit">
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <div className="text-sm font-medium">{editingId ? 'FAQ 수정' : 'FAQ 등록'}</div>
          <div className="grid md:grid-cols-3 gap-2">
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
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              게시
            </label>
          </div>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={4}
            placeholder="내용"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <button type="button" onClick={() => void save()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">
            저장
          </button>
        </div>
      </PermissionGate>

      <div className="bg-white border rounded-xl divide-y">
        {items.map((f) => (
          <div key={String(f.id)} className="p-4 flex justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">
                {String(f.audience)} · {f.isPublished ? '게시' : '비게시'} · {String(f.categoryName || '-')}
              </div>
              <div className="font-medium">{String(f.title)}</div>
              <div className="text-sm text-gray-600 whitespace-pre-wrap mt-1">{String(f.content)}</div>
            </div>
            <div className="flex flex-col gap-2">
              <PermissionGate menuKey="support_faqs" action="edit">
                <button
                  type="button"
                  className="text-xs border rounded px-2 py-1"
                  onClick={() => {
                    setEditingId(String(f.id))
                    setForm({
                      title: String(f.title || ''),
                      content: String(f.content || ''),
                      audience: String(f.audience || 'ALL'),
                      categoryId: String(f.categoryId || ''),
                      isPublished: Boolean(f.isPublished),
                    })
                  }}
                >
                  수정
                </button>
              </PermissionGate>
              <PermissionGate menuKey="support_faqs" action="delete">
                <button
                  type="button"
                  className="text-xs border rounded px-2 py-1 text-red-600"
                  onClick={async () => {
                    await adminDeleteFaq(String(f.id))
                    void load()
                  }}
                >
                  삭제
                </button>
              </PermissionGate>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
