import { test, expect } from '@playwright/test'

/**
 * Phase 6.1 — E2E: 1v1 创建/加入房间 & 协作模式
 */
test.describe('多人联机 — 房间创建与加入', () => {
  test('1v1 页面渲染：创建/加入/匹配按钮', async ({ page }) => {
    await page.goto('/#1v1-3')
    await expect(page.locator('.room-page')).toBeVisible()
    await expect(page.locator('.room-page h1')).toHaveText('1v1 对战房间')

    // 应有 创建房间 / 随机匹配 / 加入 按钮
    await expect(page.locator('[data-action="create"]')).toBeVisible()
    await expect(page.locator('[data-action="match"]')).toBeVisible()
    await expect(page.locator('.room-join-form')).toBeVisible()
  })

  test('协作页面渲染', async ({ page }) => {
    await page.goto('/#coop-3')
    await expect(page.locator('.room-page')).toBeVisible()
    await expect(page.locator('.room-page h1')).toHaveText('协作房间')
  })

  test('创建 1v1 房间后显示房间码', async ({ page }) => {
    await page.goto('/#1v1-3')
    await page.locator('[data-action="create"]').click()

    // 房间卡片出现，房间码不再是默认值
    const roomCode = page.locator('[data-room-code]')
    await expect(roomCode).not.toHaveText('------', { timeout: 5000 })

    // 房主玩家列表显示
    await expect(page.locator('[data-player-list] .room-player')).toHaveCount(1)
  })

  test('两个客户端 1v1 联机：创建房间 → 加入房间', async ({ page }) => {
    // 用两个 browser context 模拟两个玩家
    const context = page.context()
    const page2 = await context.newPage()

    // 玩家1：创建房间
    await page.goto('/#1v1-3')
    await page.locator('[data-action="create"]').click()
    const roomCodeEl = page.locator('[data-room-code]')
    await expect(roomCodeEl).not.toHaveText('------', { timeout: 5000 })
    const roomCode = await roomCodeEl.textContent()

    // 玩家2：加入房间
    await page2.goto('/#1v1-3')
    await page2.locator('.room-code-input').fill(roomCode!)
    await page2.locator('.room-join-form button[type="submit"]').click()

    // 两个页面都显示 2 个玩家
    await expect(page.locator('[data-player-list] .room-player')).toHaveCount(2, { timeout: 5000 })
    await expect(page2.locator('[data-player-list] .room-player')).toHaveCount(2, { timeout: 5000 })

    await page2.close()
  })

  test('协作模式：两个玩家自由模式', async ({ page }) => {
    const context = page.context()
    const page2 = await context.newPage()

    // 主机创建协作房间
    await page.goto('/#coop-3')
    await page.locator('[data-action="create"]').click()
    const roomCodeEl = page.locator('[data-room-code]')
    await expect(roomCodeEl).not.toHaveText('------', { timeout: 5000 })
    const roomCode = await roomCodeEl.textContent()

    // 另一个玩家加入
    await page2.goto('/#coop-3')
    await page2.locator('.room-code-input').fill(roomCode!)
    await page2.locator('.room-join-form button[type="submit"]').click()

    // 双方都看到 2 个玩家
    await expect(page.locator('[data-player-list] .room-player')).toHaveCount(2, { timeout: 5000 })
    await expect(page2.locator('[data-player-list] .room-player')).toHaveCount(2, { timeout: 5000 })

    // 协作控制区可见
    await expect(page.locator('[data-coop-controls]')).toBeVisible()
    // 自由模式（非轮流）应显示"自由模式"
    await expect(page.locator('[data-turn-status]')).toContainText('自由模式')

    await page2.close()
  })

  test('协作模式：切换轮流模式', async ({ page }) => {
    await page.goto('/#coop-3')
    await page.locator('[data-action="create"]').click()
    await expect(page.locator('[data-room-code]')).not.toHaveText('------', { timeout: 5000 })

    // 点击轮流模式
    await page.locator('[data-action="turn-mode"]').click()
    await page.waitForTimeout(200)

    // 状态文字应包含"轮流模式"
    await expect(page.locator('[data-turn-status]')).toContainText('轮流模式')
  })

  test('返回按钮回到首页', async ({ page }) => {
    await page.goto('/#1v1-3')
    await page.locator('[data-action="back"]').click()
    // 回到首页（显示 HomePage 元素）
    await expect(page.locator('.home-title')).toBeVisible()
  })
})
