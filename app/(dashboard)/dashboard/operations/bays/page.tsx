'use client'
import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import OperationsSubNav from '@/components/features/operations/OperationsSubNav'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { createBay, setBayActive, updateBay } from '@/lib/bays-api'
import { useBays } from '@/lib/hooks/useBays'
import { useBusinessMe } from '@/lib/hooks/useBusinessMe'
import {
  formatResourceManageTitle,
  formatResourceName,
  resolveResourceLabel,
} from '@/lib/resource-label'
import { CARD, BTN_PRIMARY } from '@/lib/dashboard-ui'
import type { BusinessBay } from '@/types'

export default function BaysPage() {
  const { bays, loading, isLive, refetch } = useBays()
  const { display: businessDisplay } = useBusinessMe()
  const resourceLabel = resolveResourceLabel(
    businessDisplay?.bizType,
    businessDisplay?.resourceLabel,
  )
  const resourceManage = formatResourceManageTitle(
    businessDisplay?.bizType,
    businessDisplay?.resourceLabel,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editBay, setEditBay] = useState<BusinessBay | null>(null)
  const [formName, setFormName] = useState('')
  const [formSortOrder, setFormSortOrder] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openAdd() {
    setEditBay(null)
    setFormName('')
    setFormSortOrder((bays.filter((b) => b.is_active).length || bays.length) + 1)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(bay: BusinessBay) {
    setEditBay(bay)
    setFormName(bay.name)
    setFormSortOrder(bay.sort_order)
    setError(null)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!formName.trim()) {
      setError(`${resourceLabel}명을 입력해주세요.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editBay) {
        await updateBay(editBay.id, { name: formName.trim(), sort_order: formSortOrder })
      } else {
        await createBay({ name: formName.trim(), sort_order: formSortOrder, is_active: true })
      }
      setModalOpen(false)
      await refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(bay: BusinessBay) {
    if (!isLive) return
    try {
      await setBayActive(bay.id, !bay.is_active)
      await refetch()
    } catch (e) {
      console.log('[bays] toggle active failed', e)
    }
  }

  return (
    <div className="space-y-4">
      <OperationsSubNav />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{resourceManage}</h2>
          <p className="text-xs text-gray-400 mt-1">비활성 {resourceLabel}는 예약 자동배정에서 제외됩니다.</p>
        </div>
        <button type="button" onClick={openAdd} className={`${BTN_PRIMARY} flex items-center gap-1 shrink-0`}>
          <Plus size={14} /> {resourceLabel} 추가
        </button>
      </div>

      {loading ? <p className="text-sm text-gray-400">불러오는 중...</p> : null}

      <div className="space-y-2">
        {bays.map((bay) => (
          <div key={bay.id} className={`${CARD} ${!bay.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{bay.name}</span>
                  <Badge className={bay.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {bay.is_active ? '활성' : '비활성'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">정렬순서 {bay.sort_order}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(bay)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Pencil size={12} /> 수정
                </button>
                <button
                  type="button"
                  onClick={() => void toggleActive(bay)}
                  disabled={!isLive}
                  className={`text-xs px-2.5 py-1 rounded-lg border ${
                    bay.is_active
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {bay.is_active ? '비활성화' : '활성화'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLive && !loading ? (
        <p className="text-xs text-center text-gray-400">데모 데이터 (API 연결 시 실제 {resourceLabel} 목록 표시)</p>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editBay ? `${resourceLabel} 수정` : `${resourceLabel} 추가`}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">{resourceLabel}명</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={formatResourceName(businessDisplay?.bizType, 1)}
            />
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
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className={`${BTN_PRIMARY} w-full`}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
