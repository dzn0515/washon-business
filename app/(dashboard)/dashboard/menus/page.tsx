'use client'

import { useCallback, useMemo, useState } from 'react'

import { Plus, CloudRain } from 'lucide-react'

import Badge from '@/components/ui/Badge'

import Modal from '@/components/ui/Modal'

import { useMenus } from '@/lib/hooks/useMenus'

import { useGroupedMenus } from '@/lib/hooks/useGroupedMenus'

import { createMenu, updateMenu } from '@/lib/store-api'

import type { BusinessHours } from '@/types'

import { getMenuNamePlaceholder } from '@/lib/business-types'

import { CARD, BTN_PRIMARY, type PriceGrid } from '@/lib/dashboard-ui'

import {
  applyMenuBasePrice,
  getRepresentativeMenuPrice,
} from '@/lib/menu-form'

import {
  getDefaultFormCategory,
  getMenuCategoriesForBiz,
  getMenuFormConfig,
  getSharedFieldKeys,
  inferFormCategoryFromApi,
  syncExtrasToBasePrice,
  type MenuFormExtras,
} from '@/lib/menu-form-config'

import MenuFormBody from '@/components/menus/MenuFormBody'

import MenuListCard from '@/components/menus/MenuListCard'

import { buildMenuPayload, validateMenuPayload } from '@/lib/menu-payload'

import {
  buildMenuCardDisplay,
  parseMenuMeta,
  stripInternalMetaKeys,
} from '@/lib/menu-display'

import { useDemoMode } from '@/components/providers/DemoModeProvider'

import { useBusinessMe } from '@/lib/hooks/useBusinessMe'

import {
  shouldShowVehiclePriceGrid,
} from '@/lib/pricing-label'

type MenuListItem = {
  apiId: string
  name: string
  description: string | null
  category: string | null
  duration_minutes: number
  price: number
  price_grid: PriceGrid
  is_active: boolean
  is_popular: boolean
  localId?: number
}

type Tab = 'menus' | 'hours' | 'holidays'



const TABS: { key: Tab; label: string }[] = [

  { key: 'menus', label: '메뉴' },

  { key: 'hours', label: '영업시간' },

  { key: 'holidays', label: '휴무 관리' },

]

export default function MenusPage() {

  const { isDemo } = useDemoMode()

  const { menus: apiMenus, hours: apiHours, holidays, loading: menusLoading, error: menusError, refreshMenus } = useMenus()

  const {

    groupedMenus,

    groupedCategories,

    groupedLoading,

    groupedError,

    businessType,

    refreshGrouped,

  } = useGroupedMenus(!isDemo)

  const { display: businessDisplay } = useBusinessMe()

  const pricingBizType = businessDisplay?.bizType || businessType || 'wash'

  const showVehicleGrid = shouldShowVehiclePriceGrid(pricingBizType)



  const [tab, setTab] = useState<Tab>('menus')

  const [activeOverrides, setActiveOverrides] = useState<Record<number, boolean>>({})

  const [hoursDraft, setHoursDraft] = useState<BusinessHours[] | null>(null)

  const [modalOpen, setModalOpen] = useState(false)

  const [editId, setEditId] = useState<number | null>(null)

  const [formName, setFormName] = useState('')

  const [formDuration, setFormDuration] = useState(40)

  const [formBasePrice, setFormBasePrice] = useState(25000)

  const [formPrices, setFormPrices] = useState<PriceGrid>(applyMenuBasePrice(25000, 'wash'))

  const [formVisible, setFormVisible] = useState(true)

  const [formCategory, setFormCategory] = useState('wash')

  const [formExtras, setFormExtras] = useState<MenuFormExtras>({})

  const [formExistingDescription, setFormExistingDescription] = useState<string | null>(null)

  const [editMenuApiId, setEditMenuApiId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)

  const [saveError, setSaveError] = useState<string | null>(null)

  const formConfig = useMemo(
    () => getMenuFormConfig(pricingBizType, formCategory),
    [pricingBizType, formCategory],
  )

  const categoryOptions = useMemo(
    () => getMenuCategoriesForBiz(pricingBizType),
    [pricingBizType],
  )



  const menus = useMemo(() => {

    if (Object.keys(activeOverrides).length === 0) return apiMenus

    return apiMenus.map((m) =>

      activeOverrides[m.id] === undefined ? m : { ...m, is_active: activeOverrides[m.id]! },

    )

  }, [apiMenus, activeOverrides])

  const menuByApiId = useMemo(() => {
    const map = new Map<string, (typeof apiMenus)[number]>()
    for (const menu of apiMenus) {
      map.set(menu.apiId, menu)
    }
    return map
  }, [apiMenus])

  const menuListItems = useMemo((): MenuListItem[] => {
    if (menus.length > 0) {
      return menus.map((m) => ({
        apiId: m.apiId,
        name: m.name,
        description: m.description,
        category: m.category,
        duration_minutes: m.duration_minutes,
        price: getRepresentativeMenuPrice(m.price_grid, pricingBizType),
        price_grid: m.price_grid,
        is_active: m.is_active,
        is_popular: m.is_popular,
        localId: m.id,
      }))
    }
    const items: MenuListItem[] = []
    for (const cat of groupedCategories) {
      for (const item of groupedMenus[cat] ?? []) {
        const full = menuByApiId.get(item.id)
        items.push({
          apiId: item.id,
          name: item.name,
          description: full?.description ?? null,
          category: item.category,
          duration_minutes: item.duration_minutes,
          price: item.price,
          price_grid: applyMenuBasePrice(item.price, pricingBizType),
          is_active: item.is_active,
          is_popular: false,
        })
      }
    }
    return items
  }, [menus, groupedCategories, groupedMenus, menuByApiId, pricingBizType])



  const hours = hoursDraft ?? apiHours



  const openAdd = useCallback(() => {

    setEditId(null)

    setEditMenuApiId(null)

    setFormName('')

    setFormDuration(40)

    setFormBasePrice(25000)

    setFormPrices(applyMenuBasePrice(25000, pricingBizType))

    setFormVisible(true)

    setFormCategory(getDefaultFormCategory(pricingBizType))

    setFormExtras({})

    setFormExistingDescription(null)

    setSaveError(null)

    setModalOpen(true)

  }, [pricingBizType])



  const openEditItem = useCallback(
    (item: MenuListItem) => {
      setEditId(item.localId ?? null)
      setEditMenuApiId(item.apiId)
      setFormName(item.name)
      setFormDuration(item.duration_minutes)

      const meta = parseMenuMeta(item.description)
      const extras = stripInternalMetaKeys(meta)
      const formCat =
        typeof meta._formCategory === 'string'
          ? meta._formCategory
          : inferFormCategoryFromApi(pricingBizType, item.category)
      const config = getMenuFormConfig(pricingBizType, formCat)
      const price = syncExtrasToBasePrice(config, extras, item.price)

      setFormBasePrice(price)
      setFormPrices(
        showVehicleGrid ? item.price_grid : applyMenuBasePrice(price, pricingBizType),
      )
      setFormVisible(item.is_active)
      setFormCategory(formCat)
      setFormExtras(extras)
      setFormExistingDescription(item.description)
      setSaveError(null)
      setModalOpen(true)
    },
    [pricingBizType, showVehicleGrid],
  )

  const handleCategoryChange = useCallback(
    (nextCategory: string) => {
      const prevConfig = getMenuFormConfig(pricingBizType, formCategory)
      const nextConfig = getMenuFormConfig(pricingBizType, nextCategory)
      const shared = getSharedFieldKeys(prevConfig.fields, nextConfig.fields)
      setFormExtras((prev) => {
        const kept: MenuFormExtras = {}
        for (const key of shared) {
          if (prev[key] !== undefined) kept[key] = prev[key]
        }
        return kept
      })
      setFormCategory(nextCategory)
    },
    [pricingBizType, formCategory],
  )

  const handleBasePriceChange = useCallback((v: number) => {

    setFormBasePrice(v)

    setFormPrices(applyMenuBasePrice(v, pricingBizType))

  }, [pricingBizType])

  const handleExtraChange = useCallback((key: string, value: string | number | boolean) => {
    setFormExtras((prev) => ({ ...prev, [key]: value }))
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
    (menusLoading || groupedLoading) && menuListItems.length === 0 && !menusError



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

          ) : menuListItems.length === 0 ? (

            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center">

              <p className="text-sm text-gray-500">

                {menusError ? '메뉴 정보를 불러올 수 없습니다.' : '등록된 메뉴가 없습니다.'}

              </p>

            </div>

          ) : (

            <div className="grid gap-3 sm:grid-cols-2">

              {menuListItems.map((item) => {
                const display = buildMenuCardDisplay(
                  {
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    price: item.price,
                    duration_minutes: item.duration_minutes,
                    price_grid: item.price_grid,
                  },
                  pricingBizType,
                )
                return (
                  <MenuListCard
                    key={item.apiId}
                    display={display}
                    isActive={item.is_active}
                    isPopular={item.is_popular}
                    onEdit={() => openEditItem(item)}
                    showToggle={showVehicleGrid && item.localId !== undefined}
                    onToggle={
                      item.localId !== undefined ? () => toggleMenu(item.localId!) : undefined
                    }
                  />
                )
              })}

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

              onChange={(e) => handleCategoryChange(e.target.value)}

              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"

            >

              {categoryOptions.map(({ value, label }) => (

                <option key={value} value={value}>

                  {label}

                </option>

              ))}

            </select>

          </div>

          <MenuFormBody

            bizType={pricingBizType}

            showVehicleGrid={formConfig.showVehicleGrid}

            showName={formConfig.showName}

            showDuration={formConfig.showDuration}

            namePlaceholder={getMenuNamePlaceholder(pricingBizType)}

            priceSectionTitle={formConfig.priceSectionTitle}

            priceHint={formConfig.priceHint}

            fields={formConfig.fields}

            formName={formName}

            formDuration={formDuration}

            formBasePrice={formBasePrice}

            formPrices={formPrices}

            extras={formExtras}

            onNameChange={setFormName}

            onDurationChange={setFormDuration}

            onBasePriceChange={handleBasePriceChange}

            onPricesChange={setFormPrices}

            onExtraChange={handleExtraChange}

          />

          <label className="flex items-center gap-2 text-sm">

            <input type="checkbox" checked={formVisible} onChange={(e) => setFormVisible(e.target.checked)} className="rounded" />

            고객앱 노출

          </label>

          {saveError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {saveError}
            </p>
          ) : null}

          <div className="flex gap-2 pt-2">

            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">

              취소

            </button>

            <button

              type="button"

              disabled={saving}

              onClick={async () => {

                const payload = buildMenuPayload({

                  name: formName,

                  duration: formDuration,

                  visible: formVisible,

                  formCategory,

                  pricingBizType,

                  formBasePrice,

                  formPrices,

                  formExtras,

                  existingDescription: formExistingDescription,

                })

                const validationError = validateMenuPayload(payload)

                if (validationError) {

                  setSaveError(validationError)

                  return

                }

                setSaving(true)

                setSaveError(null)

                try {

                  if (editMenuApiId) {

                    await updateMenu(editMenuApiId, payload)

                  } else {

                    await createMenu(payload)

                  }

                  await Promise.all([refreshGrouped(), Promise.resolve(refreshMenus())])

                  setModalOpen(false)

                } catch (e) {

                  const msg = e instanceof Error ? e.message : '메뉴 저장에 실패했습니다.'

                  setSaveError(msg)

                } finally {

                  setSaving(false)

                }

              }}

              className={`flex-1 py-2.5 text-sm ${BTN_PRIMARY} disabled:opacity-60`}

            >

              {saving ? '저장 중...' : '저장하기'}

            </button>

          </div>

        </div>

      </Modal>

    </div>

  )

}

