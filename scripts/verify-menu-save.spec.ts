/**
 * Menu add save — run: npx playwright test scripts/verify-menu-save.spec.ts
 */
import { test, expect } from '@playwright/test'

const BASE = 'https://business.autoon.kr'
const QA_PASSWORD = 'qaTest1234'
const WASH_PASSWORD = 'washon1234'

test.describe.configure({ timeout: 90_000 })

async function loginAs(page: import('@playwright/test').Page, email: string, password = QA_PASSWORD) {
  await page.goto(`${BASE}/login`)
  await page.getByPlaceholder('이메일').fill(email)
  await page.getByPlaceholder('비밀번호').fill(password)
  await page.getByRole('button', { name: '이메일로 로그인' }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30000 })
}

async function fillMenuName(page: import('@playwright/test').Page, value: string) {
  const dialog = page.getByRole('dialog')
  await dialog.locator('label:has-text("메뉴 이름") + input').fill(value)
}

async function openAddMenu(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/dashboard/menus`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: '메뉴 추가' }).waitFor({ state: 'visible', timeout: 20000 })
  await page.getByRole('button', { name: '메뉴 추가' }).click()
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
}

test('wash — add menu appears in list after save', async ({ page }) => {
  const stamp = Date.now()
  const menuName = `QA세차메뉴-${stamp}`

  await loginAs(page, 'owner@washon.kr', WASH_PASSWORD)
  await openAddMenu(page)
  await fillMenuName(page, menuName)

  const grid = page.getByRole('dialog').locator('.grid.grid-cols-3')
  await grid.locator('input').nth(0).fill('22000')
  await grid.locator('input').nth(1).fill('28000')

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/v1/business/menus') && r.request().method() === 'POST',
      { timeout: 30000 },
    ),
    page.getByRole('button', { name: '저장하기' }).click(),
  ])

  expect(response.status()).toBe(201)
  await expect(page.getByText(menuName)).toBeVisible({ timeout: 15000 })
})

test('tire — add all-products menu appears in list', async ({ page }) => {
  const stamp = Date.now()
  const menuName = `QA타이어전상품-${stamp}`

  try {
    await loginAs(page, 'qa-tire@test.autoon.kr')
  } catch {
    test.skip(true, 'qa-tire not seeded')
    return
  }

  await openAddMenu(page)
  await fillMenuName(page, menuName)
  await page.getByRole('dialog').locator('input[type="number"]').first().fill('80000')

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/v1/business/menus') && r.request().method() === 'POST',
      { timeout: 30000 },
    ),
    page.getByRole('button', { name: '저장하기' }).click(),
  ])

  expect(response.status()).toBe(201)
  await expect(page.getByText(menuName)).toBeVisible({ timeout: 15000 })
})

test('tire — add tire replace category menu appears in list', async ({ page }) => {
  const stamp = Date.now()
  const menuName = `QA타이어교체-${stamp}`

  try {
    await loginAs(page, 'qa-tire@test.autoon.kr')
  } catch {
    test.skip(true, 'qa-tire not seeded')
    return
  }

  await openAddMenu(page)

  const categorySelect = page.getByRole('dialog').locator('select[name="category"]')
  await categorySelect.selectOption('tire_replace')

  await fillMenuName(page, menuName)
  await page.getByRole('dialog').locator('input[type="number"]').first().fill('95000')

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/v1/business/menus') && r.request().method() === 'POST',
      { timeout: 30000 },
    ),
    page.getByRole('button', { name: '저장하기' }).click(),
  ])

  expect(response.status()).toBe(201)
  await expect(page.getByText(menuName)).toBeVisible({ timeout: 15000 })
})

test('glass_tint — add front tint menu appears in list', async ({ page }) => {
  const stamp = Date.now()
  const menuName = `QA전면썬팅-${stamp}`

  try {
    await loginAs(page, 'qa-glass-tint@test.autoon.kr')
  } catch {
    test.skip(true, 'qa-glass-tint not seeded')
    return
  }

  await openAddMenu(page)

  const categorySelect = page.getByRole('dialog').locator('select[name="category"]')
  if (await categorySelect.count()) {
    await categorySelect.selectOption('front').catch(() => categorySelect.selectOption({ label: '전면 썬팅' }))
  }

  await fillMenuName(page, menuName)
  await page.getByRole('dialog').locator('input[type="number"]').first().fill('150000')

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/v1/business/menus') && r.request().method() === 'POST',
      { timeout: 30000 },
    ),
    page.getByRole('button', { name: '저장하기' }).click(),
  ])

  expect(response.status()).toBe(201)
  await expect(page.getByText(menuName)).toBeVisible({ timeout: 15000 })
})

test('oil_maintenance — add menu with single price appears in list', async ({ page }) => {
  const stamp = Date.now()
  const menuName = `QA정비메뉴-${stamp}`

  try {
    await loginAs(page, 'qa-oil-maintenance@test.autoon.kr')
  } catch {
    test.skip(true, 'qa-oil-maintenance not seeded')
    return
  }

  await openAddMenu(page)
  await fillMenuName(page, menuName)
  await page.getByRole('dialog').locator('input[type="number"]').first().fill('55000')

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/v1/business/menus') && r.request().method() === 'POST',
      { timeout: 30000 },
    ),
    page.getByRole('button', { name: '저장하기' }).click(),
  ])

  expect(response.status()).toBe(201)
  await expect(page.getByText(menuName)).toBeVisible({ timeout: 15000 })
})

test('save failure shows error message', async ({ page }) => {
  await loginAs(page, 'owner@washon.kr', WASH_PASSWORD)
  await openAddMenu(page)

  await fillMenuName(page, '')
  await page.getByRole('dialog').locator('.grid.grid-cols-3 input').first().fill('0')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByText('메뉴 이름을 입력해주세요.')).toBeVisible()
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
})
