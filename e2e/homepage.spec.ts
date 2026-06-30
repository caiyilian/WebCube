import { test, expect } from '@playwright/test'

/**
 * Phase 6.1 — E2E: 首页选择模式和阶数
 */
test.describe('HomePage — 模式与阶数选择', () => {
  test('首页渲染正确：标题、阶数按钮、模式卡片', async ({ page }) => {
    await page.goto('/')

    // 标题
    await expect(page.locator('.home-title')).toHaveText('WebCube')

    // 阶数按钮默认选中 3×3
    const sizeBtns = page.locator('.home-size-btn')
    await expect(sizeBtns).toHaveCount(3)
    await expect(sizeBtns.nth(1)).toHaveClass(/active/)

    // 模式卡片
    const modeCards = page.locator('.home-mode-card')
    await expect(modeCards).toHaveCount(5)
    await expect(modeCards.nth(0)).toContainText('练习模式')
    await expect(modeCards.nth(1)).toContainText('CFOP 训练')
    await expect(modeCards.nth(2)).toContainText('1v1 对战')
    await expect(modeCards.nth(3)).toContainText('协作模式')
    await expect(modeCards.nth(4)).toContainText('锦标赛')
  })

  test('点击阶数按钮切换选中状态', async ({ page }) => {
    await page.goto('/')

    const sizes = page.locator('.home-size-btn')
    // 默认 3 已选中，点击 2
    await sizes.nth(0).click()
    await expect(sizes.nth(0)).toHaveClass(/active/)
    await expect(sizes.nth(1)).not.toHaveClass(/active/)
    await expect(sizes.nth(2)).not.toHaveClass(/active/)

    // 点击 4
    await sizes.nth(2).click()
    await expect(sizes.nth(2)).toHaveClass(/active/)
    await expect(sizes.nth(0)).not.toHaveClass(/active/)
    await expect(sizes.nth(1)).not.toHaveClass(/active/)
  })

  test('点击练习模式进入游戏（HUD 渲染）', async ({ page }) => {
    await page.goto('/')
    await page.locator('.home-mode-card').nth(0).click()
    // 应用使用 showRoute() 渲染游戏 UI，不更新 URL hash
    await expect(page.locator('.hud-container')).toBeVisible()
    await expect(page.locator('.hud-timer')).toBeVisible()
  })

  test('切换阶数到 4×4 后点击练习模式渲染游戏', async ({ page }) => {
    await page.goto('/')
    await page.locator('.home-size-btn').nth(2).click() // 4×4
    await page.locator('.home-mode-card').nth(0).click() // 练习模式
    await expect(page.locator('.hud-container')).toBeVisible()
  })

  test('CFOP 模式渲染 CFOP 面板（无视阶数选择为 3×3）', async ({ page }) => {
    await page.goto('/')
    await page.locator('.home-size-btn').nth(0).click() // 2×2
    await page.locator('.home-mode-card').nth(1).click() // CFOP
    await expect(page.locator('.cfop-panel')).toBeVisible()
    await expect(page.locator('.hud-container')).toBeVisible()
  })

  test('锦标赛模式渲染锦标赛页面', async ({ page }) => {
    await page.goto('/')
    await page.locator('.home-size-btn').nth(0).click() // 2×2
    await page.locator('.home-mode-card').nth(4).click() // 锦标赛
    await expect(page.locator('.tournament-page')).toBeVisible()
  })

  test('直接输入 hash 路由可导航到对应模式', async ({ page }) => {
    await page.goto('/#practice-2')
    await expect(page.locator('.hud-container')).toBeVisible()
    await expect(page.locator('.hud-timer')).toBeVisible()
  })
})
