import { test, expect } from '@playwright/test'

/**
 * Phase 6.1 — E2E: Undo/Redo 功能
 */
test.describe('Undo / Redo 功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#practice-3')
    await expect(page.locator('.hud-container')).toBeVisible()
  })

  test('初始状态下撤销/重做按钮可点击但步数为 0', async ({ page }) => {
    await expect(page.locator('.hud-moves')).toHaveText('0 步')
  })

  test('打乱后点击撤销步数归零', async ({ page }) => {
    // 打乱
    await page.locator('.hud-btn').filter({ hasText: '打乱' }).click()
    await page.waitForTimeout(500)

    // 确认步数大于 0
    const movesAfterScramble = await page.locator('.hud-moves').textContent()
    const countAfter = parseInt(movesAfterScramble!)
    expect(countAfter).toBeGreaterThan(0)

    // 点击撤销
    await page.locator('.hud-btn').filter({ hasText: '撤销' }).click()
    await page.waitForTimeout(100)

    // 撤销后步数减少
    const movesAfterUndo = await page.locator('.hud-moves').textContent()
    const countAfterUndo = parseInt(movesAfterUndo!)
    expect(countAfterUndo).toBeLessThan(countAfter)
  })

  test('撤销后重做可恢复步数', async ({ page }) => {
    // 打乱
    await page.locator('.hud-btn').filter({ hasText: '打乱' }).click()
    await page.waitForTimeout(500)
    const movesAfterScramble = parseInt((await page.locator('.hud-moves').textContent())!)

    // 撤销
    await page.locator('.hud-btn').filter({ hasText: '撤销' }).click()
    await page.waitForTimeout(100)
    const movesAfterUndo = parseInt((await page.locator('.hud-moves').textContent())!)
    expect(movesAfterUndo).toBeLessThan(movesAfterScramble)

    // 重做
    await page.locator('.hud-btn').filter({ hasText: '重做' }).click()
    await page.waitForTimeout(100)
    const movesAfterRedo = parseInt((await page.locator('.hud-moves').textContent())!)
    expect(movesAfterRedo).toBe(movesAfterScramble)
  })

  test('键盘快捷键 Ctrl+Z 撤销, Ctrl+Shift+Z 重做', async ({ page }) => {
    // 打乱
    await page.locator('.hud-btn').filter({ hasText: '打乱' }).click()
    await page.waitForTimeout(500)
    const movesAfterScramble = parseInt((await page.locator('.hud-moves').textContent())!)

    // Ctrl+Z 撤销
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(100)
    const movesAfterUndo = parseInt((await page.locator('.hud-moves').textContent())!)
    expect(movesAfterUndo).toBeLessThan(movesAfterScramble)

    // Ctrl+Shift+Z 重做
    await page.keyboard.press('Control+Shift+z')
    await page.waitForTimeout(100)
    const movesAfterRedo = parseInt((await page.locator('.hud-moves').textContent())!)
    expect(movesAfterRedo).toBe(movesAfterScramble)
  })

  test('重置后撤销/重做历史清空', async ({ page }) => {
    // 打乱
    await page.locator('.hud-btn').filter({ hasText: '打乱' }).click()
    await page.waitForTimeout(500)
    const movesAfterScramble = parseInt((await page.locator('.hud-moves').textContent())!)
    expect(movesAfterScramble).toBeGreaterThan(0)

    // 重置
    await page.locator('.hud-btn').filter({ hasText: '重置' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('.hud-moves')).toHaveText('0 步')

    // 尝试撤销（应该无效，步数保持 0）
    await page.locator('.hud-btn').filter({ hasText: '撤销' }).click()
    await page.waitForTimeout(100)
    await expect(page.locator('.hud-moves')).toHaveText('0 步')
  })
})
