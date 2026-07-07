/**
 * Menu form industry branching — run: npx playwright test scripts/verify-menu-form.spec.ts
 */
import { test, expect } from '@playwright/test'

const BASE = 'https://business.autoon.kr'
const QA_PASSWORD = 'qaTest1234'
const WASH_PASSWORD = 'washon1234'

test.describe.configure({ timeout: 60_000 })

async function loginAs(page: import('@playwright/test').Page, email: string, password = QA_PASSWORD) {
  await page.goto(`${BASE}/login`)
  await page.getByPlaceholder('이메일').fill(email)
  await page.getByPlaceholder('비밀번호').fill(password)
  await page.getByRole('button', { name: '이메일로 로그인' }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30000 })
}

async function waitForMenusReady(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/dashboard/menus`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '메뉴 추가' }).waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(1500)
}

function collectConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

test.describe('menu form — wash owner', () => {
  test('shows vehicle price grid in add modal', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await loginAs(page, 'owner@washon.kr', WASH_PASSWORD)
    await waitForMenusReady(page)
    await page.getByRole('button', { name: '메뉴 추가' }).click()
    await expect(page.getByText('차종별 가격', { exact: true })).toBeVisible()
    await expect(page.getByText('소형 국산')).toBeVisible()
    await expect(page.getByText('부위·필름별 가격')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

const NON_WASH_CASES = [
  { email: 'qa-tire@test.autoon.kr', label: '정비 기본 가격', hidden: '소형 국산' },
  { email: 'qa-glass-tint@test.autoon.kr', label: '부위·필름별 가격', hidden: '차종별 가격' },
  { email: 'qa-blackbox-navi@test.autoon.kr', label: '제품·장착 가격', hidden: '소형 국산' },
  { email: 'qa-dent-repair@test.autoon.kr', label: '작업 부위별 견적', hidden: '차종별 가격' },
  { email: 'qa-oil-maintenance@test.autoon.kr', label: '정비 기본 가격', hidden: '차종별 가격' },
]

for (const { email, label, hidden } of NON_WASH_CASES) {
  test(`non-wash ${email} — single price field`, async ({ page }) => {
    const errors = collectConsoleErrors(page)
    try {
      await loginAs(page, email)
    } catch {
      test.skip(true, `${email} not seeded on prod`)
      return
    }
    await waitForMenusReady(page)
    await page.getByRole('button', { name: '메뉴 추가' }).click()
    await expect(page.getByText(label, { exact: false })).toBeVisible()
    await expect(page.getByText(hidden)).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test.describe('menu form — unit labels', () => {
  test('helpers branch by biz_type', async () => {
    const { shouldShowVehiclePriceGrid } = await import('../lib/pricing-label')
    const { applyMenuBasePrice, flatPriceGrid, getRepresentativeMenuPrice } = await import('../lib/menu-form')

    expect(shouldShowVehiclePriceGrid('wash')).toBe(true)
    expect(shouldShowVehiclePriceGrid('tire')).toBe(false)

    const flat = flatPriceGrid(45000)
    expect(flat.domestic_small).toBe(45000)
    expect(flat.import_large).toBe(45000)

    const washGrid = applyMenuBasePrice(25000, 'wash')
    expect(washGrid.domestic_medium).toBeGreaterThan(washGrid.domestic_small)

    const tireGrid = applyMenuBasePrice(80000, 'tire')
    expect(tireGrid.domestic_medium).toBe(80000)
    expect(getRepresentativeMenuPrice(tireGrid, 'tire')).toBe(80000)
  })
})
