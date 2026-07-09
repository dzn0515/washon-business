/**
 * Production subscriptions full E2E + regression
 * Run: npx playwright test scripts/verify-admin-subscriptions-prod.spec.ts --config=playwright.config.ts
 */
import { test, expect } from '@playwright/test'

const BASE = 'https://business.autoon.kr'

const REGRESSION_PAGES = [
  '/admin/dashboard',
  '/admin/businesses',
  '/admin/businesses/pending',
  '/admin/reservations',
  '/admin/ad-applications',
  '/admin/subscriptions',
]

async function adminLogin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/admin/login`)
  await page.getByPlaceholder('admin@autoon.kr').fill('admin@washon.kr')
  await page.locator('input[type="password"]').fill('admin1234')
  await page.getByRole('button', { name: /로그인/ }).click()
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 })
}

async function ownerLogin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`)
  const email = page.locator('input[type="email"], input[name="email"]').first()
  await email.fill('owner@washon.kr')
  await page.locator('input[type="password"]').fill('washon1234')
  await page.getByRole('button', { name: /로그인/ }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30000 })
}

test.describe('admin subscriptions production', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('unauthenticated redirects to admin login', async ({ page }) => {
    await page.goto(`${BASE}/admin/subscriptions`)
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 })
  })

  test('list, search, filters, detail modal, actions', async ({ page }) => {
    await adminLogin(page)
    await page.goto(`${BASE}/admin/subscriptions`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /구독 관리/ })).toBeVisible({ timeout: 20000 })
    await expect(page.locator('body')).not.toContainText('Application error')
    await expect(page.locator('body')).not.toContainText('구독 목록을 불러오지 못했습니다')

    // search
    const search = page.getByPlaceholder(/업체명|사장명|연락처/)
    await search.fill('스파클')
    await page.getByRole('button', { name: '검색' }).click()
    await expect(page.getByText('스파클링 세차장')).toBeVisible({ timeout: 15000 })

    // plan filter
    await page.locator('select').nth(0).selectOption('BASIC')
    await page.waitForTimeout(500)

    // status filter
    await page.locator('select').nth(1).selectOption('FREE_TRIAL')
    await page.waitForTimeout(500)

    // open detail
    const detailBtn = page.getByRole('button', { name: '상세' }).first()
    await detailBtn.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('구독 상세')).toBeVisible({ timeout: 10000 })
    await expect(dialog.getByText('무료 종료일')).toBeVisible()
    await expect(dialog.getByText('다음 결제일')).toBeVisible()
    await expect(dialog.getByText('자동 갱신')).toBeVisible()
    await expect(dialog.getByText('결제 상태')).toBeVisible()

    // memo save
    const memo = dialog.locator('textarea').first()
    await memo.fill('playwright e2e memo')
    await dialog.getByRole('button', { name: '메모 저장' }).click()
    await page.waitForTimeout(800)

    // plan change controls present
    await expect(dialog.getByRole('button', { name: '플랜 변경' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '무료 연장' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '상태 변경' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '강제 종료' })).toBeVisible()

    // events section if any
    const events = dialog.getByText('이벤트 이력')
    if (await events.count()) {
      await expect(events).toBeVisible()
    }

    // clear memo back
    await memo.fill('')
    await dialog.getByRole('button', { name: '메모 저장' }).click()
    await page.waitForTimeout(500)
  })
})

test.describe('owner settings subscription fields', () => {
  test('settings shows subscription info from API', async ({ page }) => {
    await ownerLogin(page)
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('현재 플랜')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Basic|Standard|Premium/i)).toBeVisible()
    await expect(page.getByText(/다음 결제/)).toBeVisible()
    await expect(page.getByText(/원\/월/)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Application error')
  })
})

test.describe('admin regression after subscriptions deploy', () => {
  test('regression pages load', async ({ page }) => {
    await adminLogin(page)
    for (const path of REGRESSION_PAGES) {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), path).toBeLessThan(400)
      await expect(page.locator('body')).not.toContainText('Application error')
    }
  })
})
