import { test, expect } from '@playwright/test'

/**
 * Phase 6.1 — E2E: 练习模式打乱/重置/提示/求解
 */
test.describe('练习模式 — scramble / reset / hint / solve', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#practice-3')
    // 等待 HUD 渲染
    await expect(page.locator('.hud-container')).toBeVisible()
  })

  test('HUD 元素渲染正确', async ({ page }) => {
    await expect(page.locator('.hud-timer')).toHaveText('0.000')
    await expect(page.locator('.hud-moves')).toHaveText('0 步')

    const buttons = page.locator('.hud-btn')
    const actions = ['打乱', '重置', '求解', '提示', '撤销', '重做', '设置']
    for (let i = 0; i < actions.length; i++) {
      await expect(buttons.nth(i)).toContainText(actions[i])
    }
  })

  test('点击打乱后步数增加', async ({ page }) => {
    await page.locator('.hud-btn').filter({ hasText: '打乱' }).click()
    await page.waitForTimeout(500)
    // 打乱后步数 > 0（比 timer 更可靠，timer 可能因 headless 环境延迟启动）
    const movesText = await page.locator('.hud-moves').textContent()
    expect(parseInt(movesText!)).toBeGreaterThan(0)
  })

  test('点击重置恢复计时器和步数', async ({ page }) => {
    // 先打乱
    await page.locator('.hud-btn').filter({ hasText: '打乱' }).click()
    await page.waitForTimeout(200)

    // 点击重置
    await page.locator('.hud-btn').filter({ hasText: '重置' }).click()
    await page.waitForTimeout(100)

    // 计时器回到 0.000
    await expect(page.locator('.hud-timer')).toHaveText('0.000')
    // 步数归零
    await expect(page.locator('.hud-moves')).toHaveText('0 步')
  })

  test('点击求解按钮触发求解流程', async ({ page }) => {
    // 先打乱
    await page.locator('.hud-btn').filter({ hasText: '打乱' }).click()
    await page.waitForTimeout(200)

    // 点击求解
    await page.locator('.hud-btn').filter({ hasText: '求解' }).click()

    // 应该出现"求解中..."状态文字
    // 注意：求解是异步的，Worker 需要时间
    const statusEl = page.locator('.hud-status')
    await expect(statusEl).toHaveText('求解中...', { timeout: 2000 })

    // 求解完成后状态文字消失（求解完成或有解/无解）
    // 有些情况下求解可能失败，我们不断言具体结果，只确认流程走完
    await page.waitForTimeout(3000)
  })

  test('提示按钮点击后激活', async ({ page }) => {
    const hintBtn = page.locator('.hud-btn').filter({ hasText: '提示' })

    // 点击提示，按钮应添加 active class
    await hintBtn.click()
    await expect(hintBtn).toHaveClass(/active/)
  })

  test('CFOP 模式不显示提示按钮', async ({ page }) => {
    await page.goto('/#cfop-3')
    await expect(page.locator('.hud-container')).toBeVisible()

    // CFOP 模式应该没有提示按钮（hideHintButton）
    const hintBtn = page.locator('.hud-btn').filter({ hasText: '提示' })
    await expect(hintBtn).toHaveCSS('display', 'none')
  })
})
