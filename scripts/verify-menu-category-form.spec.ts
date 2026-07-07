/**
 * Category-specific menu form — npx playwright test scripts/verify-menu-category-form.spec.ts
 */
import { test, expect } from '@playwright/test'
import {
  getMenuFormConfig,
  getMenuCategoriesForBiz,
  getDefaultFormCategory,
} from '../lib/menu-form-config'

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
})
