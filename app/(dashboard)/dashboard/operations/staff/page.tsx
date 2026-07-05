'use client'
import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import OperationsSubNav from '@/components/features/operations/OperationsSubNav'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { createStaff, setStaffActive, updateStaff } from '@/lib/staff-api'
import { useStaff } from '@/lib/hooks/useStaff'
import { CARD, BTN_PRIMARY } from '@/lib/dashboard-ui'
import { STAFF_COLOR_PRESETS, STAFF_POSITION_PRESETS } from '@/lib/staff-ui'
import type { BusinessStaff } from '@/types'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

export default function StaffPage() {
  const { staff, loading, isLive, refetch } = useStaff()
  const { isDemo } = useDemoMode()
  const [modalOpen, setModalOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<BusinessStaff | null>(null)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPosition, setFormPosition] = useState('')
  const [formColor, setFormColor] = useState<string>(STAFF_COLOR_PRESETS[0])
  const [formSortOrder, setFormSortOrder] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openAdd() {
    setEditStaff(null)
    setFormName('')
    setFormPhone('')
    setFormPosition(STAFF_POSITION_PRESETS[0])
    setFormColor(STAFF_COLOR_PRESETS[0])
    setFormSortOrder((staff.filter((s) => s.is_active).length || staff.length) + 1)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(member: BusinessStaff) {
    setEditStaff(member)
    setFormName(member.name)
    setFormPhone(member.phone)
    setFormPosition(member.position)
    setFormColor(member.color)
    setFormSortOrder(member.sort_order)
    setError(null)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!formName.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: formName.trim(),
        phone: formPhone.trim() || null,
        position: formPosition.trim() || null,
        color: formColor,
        sort_order: formSortOrder,
      }
      if (editStaff) {
        await updateStaff(editStaff.id, payload)
      } else {
        await createStaff({ ...payload, is_active: true })
      }
      setModalOpen(false)
      await refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(member: BusinessStaff) {
    if (!isLive) return
    try {
      await setStaffActive(member.id, !member.is_active)
      await refetch()
    } catch (e) {
      console.log('[staff] toggle active failed', e)
    }
  }

  return (
    <div className="space-y-4">
      <OperationsSubNav />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">직원 관리</h2>
          <p className="text-xs text-gray-400 mt-1">비활성 직원은 신규 배정에서 제외됩니다. 기존 예약은 유지됩니다.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={isDemo}
          className={`${BTN_PRIMARY} flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Plus size={14} /> 직원 추가
        </button>
      </div>

      {loading ? <p className="text-sm text-gray-400">불러오는 중...</p> : null}

      <div className="space-y-2">
        {staff.map((member) => (
          <div key={member.id} className={`${CARD} ${!member.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-1 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: member.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{member.name}</span>
                    {member.position ? (
                      <span className="text-xs text-gray-400">{member.position}</span>
                    ) : null}
                    <Badge className={member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {member.is_active ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {member.phone || '연락처 없음'} · 정렬순서 {member.sort_order}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(member)}
                  disabled={isDemo}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pencil size={12} /> 수정
                </button>
                <button
                  type="button"
                  onClick={() => void toggleActive(member)}
                  disabled={isDemo || !isLive}
                  className={`text-xs px-2.5 py-1 rounded-lg border ${
                    member.is_active
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {member.is_active ? '비활성화' : '활성화'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLive && !loading ? (
        <p className="text-xs text-center text-gray-400">
          {isDemo ? '데모 데이터 (PC 프로그램 미리보기)' : '데모 데이터 (API 연결 시 실제 직원 목록 표시)'}
        </p>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editStaff ? '직원 수정' : '직원 추가'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">이름</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">연락처</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="010-1234-5678"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">직책</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
              value={formPosition}
              onChange={(e) => setFormPosition(e.target.value)}
              placeholder="매니저"
              list="staff-positions"
            />
            <datalist id="staff-positions">
              {STAFF_POSITION_PRESETS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-xs text-gray-500">색상</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {STAFF_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormColor(color)}
                  className={`w-7 h-7 rounded-full border-2 ${
                    formColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">정렬순서</label>
            <input
              type="number"
              min={1}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
              value={formSortOrder}
              onChange={(e) => setFormSortOrder(Number(e.target.value) || 1)}
            />
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {!isDemo ? (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className={`${BTN_PRIMARY} w-full`}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
