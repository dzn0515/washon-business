'use client'

import { useCallback, useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { CARD, BTN_PRIMARY } from '@/lib/dashboard-ui'
import {
  createVehicleRecord,
  fetchBusinessMe,
  getStoreVehicles,
  getVehicleRecords,
} from '@/lib/api'
import { CATEGORY_LABELS } from '@/types'
import type { Vehicle, VehicleRecord } from '@/types'
import { isDemoMode } from '@/lib/demo-mode'
import { demoVehicles, getDemoVehicleRecords, DEMO_STORE_ID } from '@/lib/demo-data'

import { useDemoMode } from '@/components/providers/DemoModeProvider'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function vehicleTitle(v: Vehicle): string {
  return [v.brand, v.model].filter(Boolean).join(' ') || v.license_plate
}

export default function VehiclesPage() {
  const { isDemo } = useDemoMode()
  const [storeId, setStoreId] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Vehicle | null>(null)
  const [records, setRecords] = useState<VehicleRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [formServiceType, setFormServiceType] = useState('wash')
  const [formMileage, setFormMileage] = useState('')
  const [formMemo, setFormMemo] = useState('')
  const [formNextDate, setFormNextDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadVehicles = useCallback(async () => {
    setLoading(true)
    if (isDemoMode()) {
      setStoreId(DEMO_STORE_ID)
      setVehicles(demoVehicles)
      setLoading(false)
      return
    }
    try {
      const me = await fetchBusinessMe()
      setStoreId(me.id)
      const list = await getStoreVehicles(me.id)
      setVehicles(list)
    } catch (e) {
      console.log('[vehicles] load failed', e)
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVehicles()
  }, [loadVehicles])

  const openDetail = async (vehicle: Vehicle) => {
    setSelected(vehicle)
    setRecordsLoading(true)
    if (isDemoMode()) {
      setRecords(getDemoVehicleRecords(vehicle.id))
      setRecordsLoading(false)
      return
    }
    try {
      const rows = await getVehicleRecords(vehicle.id)
      setRecords(
        [...rows].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      )
    } catch {
      setRecords([])
    } finally {
      setRecordsLoading(false)
    }
  }

  const handleAddRecord = async () => {
    if (!selected || isDemo) return
    setSubmitting(true)
    try {
      await createVehicleRecord(selected.id, {
        service_type: formServiceType,
        mileage: formMileage ? Number(formMileage) : undefined,
        memo: formMemo.trim() || undefined,
        next_service_date: formNextDate || undefined,
        photos: [],
      })
      setRecordModalOpen(false)
      setFormMileage('')
      setFormMemo('')
      setFormNextDate('')
      await openDetail(selected)
    } catch {
      alert('서비스 이력 추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">방문 차량 관리</h1>
        {storeId ? <span className="text-xs text-gray-400">매장 ID: {storeId.slice(0, 8)}…</span> : null}
      </div>

      <div className={`${CARD} overflow-x-auto`}>
        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">불러오는 중...</p>
        ) : vehicles.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">방문 차량이 없습니다</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">차량번호</th>
                <th className="py-2 pr-3 font-medium">브랜드/모델</th>
                <th className="py-2 pr-3 font-medium">연식</th>
                <th className="py-2 font-medium">색상</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => void openDetail(v)}
                >
                  <td className="py-3 pr-3 font-medium text-gray-900">{v.license_plate}</td>
                  <td className="py-3 pr-3 text-gray-700">{vehicleTitle(v)}</td>
                  <td className="py-3 pr-3 text-gray-500">{v.year ?? '-'}</td>
                  <td className="py-3 text-gray-500">{v.color ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected ? `차량 상세 · ${selected.license_plate}` : '차량 상세'}
        size="lg"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">차량번호</p>
                <p className="font-medium">{selected.license_plate}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">브랜드/모델</p>
                <p className="font-medium">{vehicleTitle(selected)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">연식</p>
                <p>{selected.year ?? '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">색상</p>
                <p>{selected.color ?? '-'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">서비스 이력</h3>
              {!isDemo ? (
                <button
                  type="button"
                  className={`text-sm px-3 py-1.5 rounded-lg ${BTN_PRIMARY}`}
                  onClick={() => setRecordModalOpen(true)}
                >
                  이력 추가
                </button>
              ) : null}
            </div>

            {recordsLoading ? (
              <p className="text-sm text-gray-400">이력 불러오는 중...</p>
            ) : records.length === 0 ? (
              <p className="text-sm text-gray-400">서비스 이력이 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-2 pr-2">날짜</th>
                      <th className="py-2 pr-2">서비스</th>
                      <th className="py-2 pr-2">주행거리</th>
                      <th className="py-2">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} className="border-b border-gray-50">
                        <td className="py-2 pr-2">{formatDate(r.created_at)}</td>
                        <td className="py-2 pr-2">
                          {CATEGORY_LABELS[r.service_type] ?? r.service_type}
                        </td>
                        <td className="py-2 pr-2">{r.mileage != null ? `${r.mileage.toLocaleString()}km` : '-'}</td>
                        <td className="py-2">{r.memo ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal open={recordModalOpen} onClose={() => setRecordModalOpen(false)} title="서비스 이력 추가">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">서비스 종류</label>
            <select
              value={formServiceType}
              onChange={(e) => setFormServiceType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">주행거리 (선택)</label>
            <input
              type="number"
              value={formMileage}
              onChange={(e) => setFormMileage(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder="km"
            />
          </div>
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">메모 (선택)</label>
            <textarea
              value={formMemo}
              onChange={(e) => setFormMemo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-[80px]"
            />
          </div>
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">다음 서비스 권장일 (선택)</label>
            <input
              type="date"
              value={formNextDate}
              onChange={(e) => setFormNextDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleAddRecord()}
            className={`w-full py-2.5 text-sm ${BTN_PRIMARY} disabled:opacity-50`}
          >
            {submitting ? '저장 중...' : '등록하기'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
