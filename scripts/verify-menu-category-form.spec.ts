/**
 * Category-specific menu form — npx playwright test scripts/verify-menu-category-form.spec.ts
 */
import { test, expect } from '@playwright/test'
import {
  getMenuFormConfig,
  getMenuCategoriesForBiz,
  getDefaultFormCategory,
  serializeMenuMeta,
  parseMenuDescription,
} from '../lib/menu-form-config'
import { buildMenuCardDisplay } from '../lib/menu-display'

test.describe('menu form config — unit', () => {
  test('tire categories have no 전상품', () => {
    const cats = getMenuCategoriesForBiz('tire')
    expect(cats.some((c) => c.label === '전상품')).toBe(false)
    expect(cats[0]?.label).toBe('타이어 교체')
  })

  test('tire 교체 shows width/aspect/inch/brand fields', () => {
    const cfg = getMenuFormConfig('tire', 'tire_replace')
    const keys = cfg.fields.map((f) => f.key)
    expect(keys).toContain('tireWidth')
    expect(keys).toContain('aspectRatio')
    expect(keys).toContain('brandMaker')
    expect(keys).toContain('productName')
    expect(keys).toContain('salePrice')
    expect(cfg.showVehicleGrid).toBe(false)
  })

  test('glass_tint 전면 shows film fields', () => {
    const cfg = getMenuFormConfig('glass_tint', 'front')
    const keys = cfg.fields.map((f) => f.key)
    expect(keys).toContain('filmBrand')
    expect(keys).toContain('filmGrade')
    expect(keys).toContain('warrantyPeriod')
  })

  test('blackbox shows brand model mobile install', () => {
    const cfg = getMenuFormConfig('blackbox_navi', 'blackbox')
    const keys = cfg.fields.map((f) => f.key)
    expect(keys).toContain('brandMaker')
    expect(keys).toContain('productModel')
    expect(keys).toContain('mobileInstall')
  })

  test('dent door_ding shows body part estimate', () => {
    const cfg = getMenuFormConfig('dent_repair', 'door_ding')
    expect(cfg.fields.some((f) => f.key === 'bodyPart')).toBe(true)
    expect(cfg.fields.some((f) => f.key === 'estimateStart')).toBe(true)
  })

  test('wash keeps vehicle grid and wash categories', () => {
    const cfg = getMenuFormConfig('wash', 'hand_wash')
    expect(cfg.showVehicleGrid).toBe(true)
    expect(cfg.fields).toHaveLength(0)
    expect(getMenuCategoriesForBiz('wash').some((c) => c.label === '손세차')).toBe(true)
    expect(getMenuCategoriesForBiz('wash').some((c) => c.label === '세차')).toBe(false)
  })

  test('default categories per industry', () => {
    expect(getDefaultFormCategory('glass_tint')).toBe('front')
    expect(getDefaultFormCategory('wash')).toBe('hand_wash')
    expect(getDefaultFormCategory('tire')).toBe('tire_replace')
  })

  test('meta round-trip and tire card display', () => {
    const description = serializeMenuMeta(null, {
      _formCategory: 'tire_replace',
      tireWidth: '235',
      aspectRatio: '55',
      tireInch: '18',
      brandMaker: '미쉐린',
      productName: '프라이머시4',
      salePrice: 180000,
    })
    const parsed = parseMenuDescription(description)
    expect(parsed.productName).toBe('프라이머시4')

    const card = buildMenuCardDisplay(
      { name: '프라이머시4', description, category: 'tire_product', price: 180000, duration_minutes: 40 },
      'tire',
    )
    expect(card.categoryBadge).toBe('타이어 교체')
    expect(card.titleLines[0]).toBe('235/55R18')
    expect(card.titleLines[1]).toBe('미쉐린 프라이머시4')
    expect(card.priceLabel).toContain('180,000')
  })

  test('tint and blackbox card display', () => {
    const tintDesc = serializeMenuMeta(null, {
      _formCategory: 'front',
      filmBrand: '레이노',
      filmGrade: 'S9',
      salePrice: 250000,
    })
    const tintCard = buildMenuCardDisplay(
      { name: '전면', description: tintDesc, category: 'construction', price: 250000, duration_minutes: 90 },
      'glass_tint',
    )
    expect(tintCard.categoryBadge).toBe('전면')
    expect(tintCard.titleLines[0]).toBe('레이노 S9')

    const blackboxDesc = serializeMenuMeta(null, {
      _formCategory: 'blackbox',
      brandMaker: '아이나비',
      productModel: 'QXD1',
      salePrice: 320000,
      mobileInstall: true,
    })
    const bbCard = buildMenuCardDisplay(
      { name: '블박스', description: blackboxDesc, category: 'blackbox', price: 320000, duration_minutes: 60 },
      'blackbox_navi',
    )
    expect(bbCard.titleLines[0]).toBe('아이나비 QXD1')
    expect(bbCard.detailLines).toContain('출장장착')
  })
})
