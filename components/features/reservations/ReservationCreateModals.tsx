'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { BTN_PRIMARY } from '@/lib/dashboard-ui'
import {
  createBlockReservation,
  createLocalReservation,
  type ApiMenu,
} from '@/lib/bookings-api'
import { apiFetch } from '@/lib/api-client'
import { useBays } from '@/lib/hooks/useBays'
import { useStaff } from '@/lib/hooks/useStaff'
import type { ReservationRow } from '@/lib/hooks/useReservations'
import { mockMenus } from '@/lib/mock/data'

type ModalKind = 'local' | 'block' | null

type Props = {
  selectedDate: string
  isDemo: boolean
  onSaved: () => void
  onDemoAdd: (row: ReservationRow) => void
}

const EMPTY_LOCAL = {
  customer_name: '',
  customer_phone: '',
  vehicle_number: '',
  vehicle_type: '',
  menu_id: '',
  start_time: '09:00',
  end_time: '10:00',
  bay_id: '',
  staff_id: '',
  note: '',
}

const EMPTY_BLOCK = {
  block_reason: '',
  start_time: '12:00',
  end_time: '13:00',
  bay_id: '',
  note: '',
}

export default function ReservationCreateModals({
  selectedDate,
  isDemo,
  onSaved,
  onDemoAdd,
}: Props) {
  const [kind, setKind] = useState<ModalKind>(null)
  const [localForm, setLocalForm] = useState(EMPTY_LOCAL)
  const [blockForm, setBlockForm] = useState(EMPTY_BLOCK)
  const [menus, setMenus] = useState<ApiMenu[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoNotice, setDemoNotice] = useState<string | null>(null)
  const { bays } = useBays()
  const { staff } = useStaff()

  useEffect(() => {
    if (!kind) return
    if (isDemo) {
      setMenus(mockMenus.map((m) => ({ id: String(m.id), name: m.name, duration_minutes: m.duration_minutes })))
      return
    }
    void apiFetch<ApiMenu[]>('/business/menus/')
      .then((rows) => setMenus(rows))
      .catch(() => setMenus([]))
  }, [kind, isDemo])

  const activeBays = bays.filter((b) => b.is_active)
  const activeStaff = staff.filter((s) => s.is_active)

  function openLocal() {
    setLocalForm({ ...EMPTY_LOCAL, menu_id: menus[0]?.id ?? '' })
    setError(null)
    setDemoNotice(null)
    setKind('local')
  }

  function openBlock() {
    setBlockForm(EMPTY_BLOCK)
    setError(null)
    setDemoNotice(null)
    setKind('block')
  }

  async function handleSaveLocal() {
    if (!localForm.customer_name.trim() || !localForm.customer_phone.trim() || !localForm.menu_id) {
      setError('고객명, 전화번호, 서비스는 필수입니다.')
      return
    }
    setSaving(true)
    setError(null)
    setDemoNotice(null)
    try {
      if (isDemo) {
        const menu = menus.find((m) => m.id === localForm.menu_id)
        onDemoAdd({
          id: `demo-local-${Date.now()}`,
          booking_number: `L-DEMO-${Date.now()}`,
          time: localForm.start_time.slice(0, 5),
          end_time: localForm.end_time.slice(0, 5),
          customer_name: localForm.customer_name,
          service_name: menu?.name ?? '로컬 예약',
          car_number: localForm.vehicle_number,
          car_model: localForm.vehicle_type,
          staff_name: activeStaff.find((s) => s.id === localForm.staff_id)?.name ?? '',
          status: 'confirmed',
          source: 'local',
          price: 0,
        })
        setDemoNotice('데모 모드에서는 저장되지 않습니다. 목록에만 임시 표시됩니다.')
        setKind(null)
        return
      }
      await createLocalReservation({
        customer_name: localForm.customer_name.trim(),
        customer_phone: localForm.customer_phone.trim(),
        vehicle_number: localForm.vehicle_number || undefined,
        vehicle_type: localForm.vehicle_type || undefined,
        menu_id: localForm.menu_id,
        booking_date: selectedDate,
        start_time: localForm.start_time,
        end_time: localForm.end_time,
        bay_id: localForm.bay_id || undefined,
        staff_id: localForm.staff_id || undefined,
        note: localForm.note || undefined,
      })
      setKind(null)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveBlock() {
    if (!blockForm.block_reason.trim()) {
      setError('차단 사유를 입력해주세요.')
      return
    }
    setSaving(true)
    setError(null)
    setDemoNotice(null)
    try {
      if (isDemo) {
        onDemoAdd({
          id: `demo-block-${Date.now()}`,
          booking_number: `BLK-DEMO-${Date.now()}`,
          time: blockForm.start_time.slice(0, 5),
          end_time: blockForm.end_time.slice(0, 5),
          customer_name: blockForm.block_reason,
          service_name: blockForm.block_reason,
          car_number: '',
          car_model: '',
          staff_name: '',
          status: 'confirmed',
          source: 'block',
          block_reason: blockForm.block_reason,
          price: 0,
        })
        setDemoNotice('데모 모드에서는 저장되지 않습니다. 목록에만 임시 표시됩니다.')
        setKind(null)
        return
      }
      await createBlockReservation({
        block_reason: blockForm.block_reason.trim(),
        booking_date: selectedDate,
        start_time: blockForm.start_time,
        end_time: blockForm.end_time,
        bay_id: blockForm.bay_id || undefined,
        note: blockForm.note || undefined,
      })
      setKind(null)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" onClick={openLocal} className={`${BTN_PRIMARY} text-sm px-3 py-2`}>
          로컬 예약 추가
        </button>
        <button
          type="button"
          onClick={openBlock}
          className="text-sm px-3 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          시간 차단
        </button>
      </div>

      {demoNotice ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {demoNotice}
        </p>
      ) : null}

      <Modal
        open={kind === 'local'}
        onClose={() => setKind(null)}
        title="로컬 예약 추가"
        size="lg"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">고객명</label>
              <input
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={localForm.customer_name}
                onChange={(e) => setLocalForm((f) => ({ ...f, customer_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">전화번호</label>
              <input
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={localForm.customer_phone}
                onChange={(e) => setLocalForm((f) => ({ ...f, customer_phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">차량번호</label>
              <input
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={localForm.vehicle_number}
                onChange={(e) => setLocalForm((f) => ({ ...f, vehicle_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">차량 종류</label>
              <input
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={localForm.vehicle_type}
                onChange={(e) => setLocalForm((f) => ({ ...f, vehicle_type: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">서비스</label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={localForm.menu_id}
              onChange={(e) => setLocalForm((f) => ({ ...f, menu_id: e.target.value }))}
            >
              <option value="">선택</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">시작 시간</label>
              <input
                type="time"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={localForm.start_time}
                onChange={(e) => setLocalForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">종료 시간</label>
              <input
                type="time"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={localForm.end_time}
                onChange={(e) => setLocalForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">베이</label>
              <select
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={localForm.bay_id}
                onChange={(e) => setLocalForm((f) => ({ ...f, bay_id: e.target.value }))}
              >
                <option value="">자동 배정</option>
                {activeBays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">담당 직원</label>
              <select
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={localForm.staff_id}
                onChange={(e) => setLocalForm((f) => ({ ...f, staff_id: e.target.value }))}
              >
                <option value="">자동 배정</option>
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">메모</label>
            <textarea
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={localForm.note}
              onChange={(e) => setLocalForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="button" disabled={saving} onClick={() => void handleSaveLocal()} className={`${BTN_PRIMARY} w-full`}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </Modal>

      <Modal open={kind === 'block'} onClose={() => setKind(null)} title="시간 차단" size="lg">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">차단 사유</label>
            <input
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="점심시간, 장비점검 등"
              value={blockForm.block_reason}
              onChange={(e) => setBlockForm((f) => ({ ...f, block_reason: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">시작 시간</label>
              <input
                type="time"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={blockForm.start_time}
                onChange={(e) => setBlockForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">종료 시간</label>
              <input
                type="time"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={blockForm.end_time}
                onChange={(e) => setBlockForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">베이</label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={blockForm.bay_id}
              onChange={(e) => setBlockForm((f) => ({ ...f, bay_id: e.target.value }))}
            >
              <option value="">자동 배정</option>
              {activeBays.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">메모</label>
            <textarea
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={blockForm.note}
              onChange={(e) => setBlockForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="button" disabled={saving} onClick={() => void handleSaveBlock()} className={`${BTN_PRIMARY} w-full`}>
            {saving ? '저장 중...' : '차단 등록'}
          </button>
        </div>
      </Modal>
    </>
  )
}
