'use client'
import { useCallback, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, CloudRain } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useMenus } from '@/lib/hooks/useMenus'
import { useGroupedMenus } from '@/lib/hooks/useGroupedMenus'
import { updateMenuCategory, type GroupedMenuItem } from '@/lib/store-api'
import type { BusinessHours } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { getMenuNamePlaceholder } from '@/lib/business-types'
import { CARD, BTN_PRIMARY, calcPriceGrid, won, type PriceGrid } from '@/lib/dashboard-ui'
import { useDemoMode } from '@/components/providers/DemoModeProvider'

type Tab = 'menus' | 'hours' | 'holidays'

const TABS: { key: Tab; label: string }[] = [
  { key: 'menus', label: '메뉴' },
  { key: 'hours', label: '영업시간' },
  { key: 'holidays', label: '휴무 관리' },
]

const PRICE_LABELS: { key: keyof PriceGrid; label: string }[] = [
  { key: 'domestic_small', label: '소형 국산' },
  { key: 'domestic_medium', label: '중형 국산' },
  { key: 'domestic_large', label: '대형 국산' },
  { key: 'import_small', label: '소형 수입' },
  { key: 'import_medium', label: '중형 수입' },
  { key: 'import_large', label: '대형 수입' },
]

function PriceGridView({ grid }: { grid: PriceGrid }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {PRICE_LABELS.map(({ key, label }) => (
        <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-400">{label}</p>
          <p className="text-xs font-medium mt-0.5">{won(grid[key])}</p>
        </div>
      ))}
    </div>
  )
}

export default function MenusPage() {
  const { isDemo } = useDemoMode()
  const { menus: apiMenus, hours: apiHours, holidays, loading: menusLoading, error: menusError } = useMenus()
  const {
    groupedMenus,
    groupedCategories,
    useGrouped,
    groupedLoading,
    groupedError,
    businessType,
    refreshGrouped,
  } = useGroupedMenus(!isDemo)

  const [tab, setTab] = useState<Tab>('menus')
  const [activeOverrides, setActiveOverrides] = useState<Record<number, boolean>>({})
  const [hoursDraft, setHoursDraft] = useState<BusinessHours[] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDuration, setFormDuration] = useState(40)
  const [formBasePrice, setFormBasePrice] = useState(25000)
  const [formPrices, setFormPrices] = useState<PriceGrid>(calcPriceGrid(25000))
  const [formVisible, setFormVisible] = useState(true)
  const [formCategory, setFormCategory] = useState('wash')
  const [editMenuApiId, setEditMenuApiId] = useState<string | null>(null)

  const menus = useMemo(() => {
    if (Object.keys(activeOverrides).length === 0) return apiMenus
    return apiMenus.map((m) =>
      activeOverrides[m.id] === undefined ? m : { ...m, is_active: activeOverrides[m.id]! },
    )
  }, [apiMenus, activeOverrides])

  const hours = hoursDraft ?? apiHours

  const openAdd = useCallback(() => {
    setEditId(null)
    setEditMenuApiId(null)
    setFormName('')
    setFormDuration(40)
    setFormBasePrice(25000)
    setFormPrices(calcPriceGrid(25000))
    setFormVisible(true)
    setFormCategory('wash')
    setModalOpen(true)
  }, [])

  const openEditGrouped = useCallback((item: GroupedMenuItem) => {
    setEditId(null)
    setEditMenuApiId(item.id)
    setFormName(item.name)
    setFormDuration(item.duration_minutes)
    setFormBasePrice(item.price)
    setFormPrices(calcPriceGrid(item.price))
    setFormVisible(item.is_active)
    setFormCategory(item.category ?? 'wash')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: number) => {
      const m = menus.find((x) => x.id === id)
      if (!m) return
      setEditId(id)
      setFormName(m.name)
      setFormDuration(m.duration_minutes)
      setFormBasePrice(m.price_grid.domestic_small)
      setFormPrices(m.price_grid)
      setFormVisible(m.is_active)
      setModalOpen(true)
    },
    [menus],
  )

  const handleBasePriceChange = useCallback((v: number) => {
    setFormBasePrice(v)
    setFormPrices(calcPriceGrid(v))
  }, [])

  const toggleMenu = useCallback((id: number) => {
    setActiveOverrides((prev) => {
      const base = apiMenus.find((m) => m.id === id)
      const displayed = prev[id] !== undefined ? prev[id]! : (base?.is_active ?? true)
      return { ...prev, [id]: !displayed }
    })
  }, [apiMenus])

  const updateHoursRow = useCallback((index: number, patch: Partial<BusinessHours>) => {
    setHoursDraft((prev) => {
      const base = prev ?? apiHours
      return base.map((row, i) => (i === index ? { ...row, ...patch } : row))
    })
  }, [apiHours])

  const showMenusLoading =
    (menusLoading && menus.length === 0 && !useGrouped) ||
    (groupedLoading && !useGrouped && menus.length === 0 && !menusError)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm border ${
                tab === t.key ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'menus' && (
          <button type="button" onClick={openAdd} className={`${BTN_PRIMARY} flex items-center gap-1 shrink-0`}>
            <Plus size={14} /> 메뉴 추가
          </button>
        )}
      </div>

      {tab === 'menus' && (
        <div className="space-y-4">
          {(menusError || groupedError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {menusError ?? groupedError}
            </div>
          )}

          {showMenusLoading ? (
            <p className="text-sm text-gray-400 py-6 text-center">메뉴 불러오는 중...</p>
          ) : useGrouped ? (
            groupedCategories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-bold text-blue-600 mb-2">
                  [{CATEGORY_LABELS[category] ?? category}]
                </h3>
                <div className="space-y-2">
                  {(groupedMenus[category] ?? []).map((item) => (
                    <div
                      key={item.id}
                      className={`${CARD} flex items-center justify-between gap-3 ${!item.is_active ? 'opacity-50' : ''}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {!item.is_active && (
                            <Badge className="bg-gray-100 text-gray-500">비활성/견본</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.duration_minutes}분 · {won(item.price)}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditGrouped(item)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : menus.length === 0 && !menusLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center">
              <p className="text-sm text-gray-500">
                {menusError ? '메뉴 정보를 불러올 수 없습니다.' : '등록된 메뉴가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {menus.map((m) => (
                <div key={m.id} className={`${CARD} ${!m.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{m.name}</span>
                        {m.is_popular && <Badge className="bg-orange-100 text-orange-700">인기</Badge>}
                        <Badge className={m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                          {m.is_active ? '노출중' : '비활성'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">소요 {m.duration_minutes}분 · 이번달 예약 {m.monthly_bookings}건</p>
                      <PriceGridView grid={m.price_grid} />
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button type="button" onClick={() => openEdit(m.id)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMenu(m.id)}
                        className={`text-[10px] px-2 py-1 rounded-lg border ${m.is_active ? 'border-gray-200 text-gray-500' : 'border-blue-200 text-blue-600 bg-blue-50'}`}
                      >
                        {m.is_active ? 'OFF' : 'ON'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'hours' && (
        <div className={CARD}>
          <div className="space-y-3">
            {hours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium text-gray-700">{h.label}</span>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={h.is_open}
                    onChange={(e) => updateHoursRow(i, { is_open: e.target.checked })}
                    className="rounded"
                  />
                  영업
                </label>
                <input
                  type="time"
                  value={h.open_time}
                  disabled={!h.is_open}
                  onChange={(e) => updateHoursRow(i, { open_time: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 disabled:opacity-40"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="time"
                  value={h.close_time}
                  disabled={!h.is_open}
                  onChange={(e) => updateHoursRow(i, { close_time: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 disabled:opacity-40"
                />
              </div>
            ))}
          </div>
          <button type="button" className={`${BTN_PRIMARY} w-full mt-4`}>저장하기</button>
        </div>
      )}

      {tab === 'holidays' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <CloudRain size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">오늘 오후 비 예보</p>
                <p className="text-sm text-gray-600 mt-0.5">원클릭으로 우천 휴무를 등록하세요</p>
              </div>
            </div>
            <button type="button" className="text-sm px-3 py-1.5 rounded-xl bg-blue-600 text-white font-medium shrink-0">
              우천 휴무 등록
            </button>
          </div>
          <div className="space-y-2">
            {holidays.map((h) => (
              <div key={h.id} className={CARD}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{h.reason}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{h.date}</p>
                  </div>
                  <Badge className={h.type === 'RAIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                    {h.type === 'RAIN' ? '우천' : '정기'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '메뉴 수정' : '메뉴 추가'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">카테고리</label>
            <select
              name="category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
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
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">메뉴 이름</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder={getMenuNamePlaceholder(businessType)}
            />
          </div>
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">소요시간 (분)</label>
            <input
              type="number"
              value={formDuration}
              onChange={(e) => setFormDuration(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">소형 국산 기준가</label>
            <input
              type="number"
              value={formBasePrice}
              onChange={(e) => handleBasePriceChange(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">입력 시 차종별 가격이 자동 계산됩니다</p>
          </div>
          <div>
            <label className="text-[12px] text-gray-400 font-medium mb-2 block">차종별 가격</label>
            <div className="grid grid-cols-3 gap-2">
              {PRICE_LABELS.map(({ key, label }) => (
                <div key={key} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <input
                    type="number"
                    value={formPrices[key]}
                    onChange={(e) => setFormPrices((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    className="w-full mt-1 text-xs border border-gray-200 rounded px-1.5 py-1"
                  />
                </div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formVisible} onChange={(e) => setFormVisible(e.target.checked)} className="rounded" />
            고객앱 노출
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
              취소
            </button>
            <button
              type="button"
              onClick={async () => {
                if (editMenuApiId) {
                  try {
                    await updateMenuCategory(editMenuApiId, formCategory)
                    await refreshGrouped()
                  } catch {
                    alert('카테고리 저장에 실패했습니다.')
                    return
                  }
                }
                setModalOpen(false)
              }}
              className={`flex-1 py-2.5 text-sm ${BTN_PRIMARY}`}
            >
              저장하기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
