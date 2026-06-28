import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAIPanel } from '../components/AIPanel'
import { useGameStore } from '../stores/useGameStore'

describe('AIPanel', () => {
  afterEach(() => {
    vi.useRealTimers()
    useGameStore.resetCube()
  })

  it('starts an AI opponent and shows progress', () => {
    vi.useFakeTimers()
    useGameStore.setCubeSize(3)
    const panel = createAIPanel()
    const select = panel.element.querySelector('[data-ai-difficulty]') as HTMLSelectElement
    select.value = 'hard'

    ;(panel.element.querySelector('[data-action="ai-start"]') as HTMLButtonElement).click()
    expect(panel.element.textContent).toContain('AI 大师 已开始')

    vi.advanceTimersByTime(150)
    expect(panel.element.textContent).toContain('AI 进行中')

    vi.advanceTimersByTime(150 * 25)
    expect(panel.element.textContent).toContain('AI 完成')

    panel.destroy()
  })

  it('can stop the AI opponent', () => {
    vi.useFakeTimers()
    const panel = createAIPanel()

    ;(panel.element.querySelector('[data-action="ai-start"]') as HTMLButtonElement).click()
    ;(panel.element.querySelector('[data-action="ai-stop"]') as HTMLButtonElement).click()

    expect(panel.element.textContent).toContain('AI 已停止')

    panel.destroy()
  })
})
