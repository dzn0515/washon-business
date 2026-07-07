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
import {
  buildMenuDisplaySubtitle,
  buildMenuDisplayTitle,
} from '../lib/menu-display'

test.describe('menu form config — unit', () => {
  test('tire 전상품 shows base price field', () => {
    const cfg = getMenuFormConfig('tire', 'all')
    expect(cfg.fields.some((f) => f.key === 'basePrice')).toBe(true)
    expect(cfg.showVehicleGrid).toBe(false)
  })

  test('tire 교체 shows inch/brand/install fields', () => {
    const cfg = getMenuFormConfig('tire', 'tire_replace')
    const keys = cfg.fields.map((f) => f.key)
    expect(keys).toContain('tireInch')
    expect(keys).toContain('brandMaker')
    expect(keys).toContain('installFee')
    expect(keys).toContain('balanceIncluded')
  })

  test('glass_tint 전면 shows film grade', () => {
    const cfg = getMenuFormConfig('glass_tint', 'front')
    expect(cfg.fields.some((f) => f.key === 'filmGrade')).toBe(true)
    expect(cfg.fields.some((f) => f.key === 'installPrice')).toBe(true)
  })

  test('blackbox_navi blackbox shows product fields', () => {
    const cfg = getMenuFormConfig('blackbox_navi', 'blackbox')
    const keys = cfg.fields.map((f) => f.key)
    expect(keys).toContain('productModel')
    expect(keys).toContain('installFee')
  })

  test('dent door_ding shows body part price', () => {
    const cfg = getMenuFormConfig('dent_repair', 'door_ding')
    expect(cfg.fields.some((f) => f.key === 'bodyPart')).toBe(true)
    expect(cfg.fields.some((f) => f.key === 'unitOrStartPrice')).toBe(true)
  })

  test('wash keeps vehicle grid', () => {
    const cfg = getMenuFormConfig('wash', 'wash')
    expect(cfg.showVehicleGrid).toBe(true)
    expect(cfg.fields).toHaveLength(0)
  })

  test('default category is all for non-wash', () => {
    expect(getDefaultFormCategory('glass_tint')).toBe('all')
    expect(getDefaultFormCategory('wash')).toBe('wash')
    expect(getMenuCategoriesForBiz('tire')[0]?.label).toBe('전상품')
  })

  test('meta round-trip and tire display title', () => {
    const description = serializeMenuMeta(null, {
      _formCategory: 'tire_replace',
      brandMaker: '미쉐린',
      tireInch: '18',
      installFee: 95000,
    })
    const parsed = parseMenuDescription(description)
    expect(parsed.brandMaker).toBe('미쉐린')
    expect(parsed.tireInch).toBe('18')

    const title = buildMenuDisplayTitle(
      { name: '프라이머시', description, category: 'tire_product' },
      'tire',
    )
    expect(title).toBe('[타이어 교체] 미쉐린 프라이머시 18인치')
  })

  test('tint and blackbox display titles', () => {
    const tintDesc = serializeMenuMeta(null, {
      _formCategory: 'front',
      filmGrade: '루마 버텍스',
      installPrice: 150000,
    })
    expect(
      buildMenuDisplayTitle(
        { name: '전면', description: tintDesc, category: 'construction' },
        'glass_tint',
      ),
    ).toBe('[전면 썬팅] 루마 버텍스')

    const blackboxDesc = serializeMenuMeta(null, {
      _formCategory: 'blackbox',
      productModel: '파인뷰 X500',
      installFee: 80000,
      productIncluded: true,
    })
    const source = { name: '블박스', description: blackboxDesc, category: 'blackbox', price: 80000 }
    expect(buildMenuDisplayTitle(source, 'blackbox_navi')).toBe('[블랙박스] 파인뷰 X500')
    expect(buildMenuDisplaySubtitle(source, 'blackbox_navi')).toContain('제품 포함')
  })
})
