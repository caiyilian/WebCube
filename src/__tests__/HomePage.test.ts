import { describe, expect, it, vi } from 'vitest'
import { normalizeGameRoute } from '../App'
import { createHomePage } from '../components/HomePage'

describe('HomePage', () => {
  it('shows one cube size selector with supported sizes only', () => {
    const homePage = createHomePage()
    const sizeButtons = Array.from(homePage.element.querySelectorAll('.home-size-btn'))

    expect(sizeButtons).toHaveLength(3)
    expect(sizeButtons.map((button) => (button as HTMLElement).dataset.size)).toEqual(['2', '3', '4'])
    expect(homePage.element.textContent).not.toContain('5×5')
  })

  it('uses the shared 1v1 mode name when starting battle mode', () => {
    const homePage = createHomePage()
    const onModeSelect = vi.fn()
    homePage.onModeSelect = onModeSelect

    const battleButton = homePage.element.querySelector('[data-mode="1v1"]') as HTMLButtonElement
    battleButton.click()

    expect(onModeSelect).toHaveBeenCalledWith('1v1', 3)
  })

  it('offers CFOP training as a 3x3 training entry', () => {
    const homePage = createHomePage()
    const onModeSelect = vi.fn()
    homePage.onModeSelect = onModeSelect

    ;(homePage.element.querySelector('[data-size="4"]') as HTMLButtonElement).click()
    ;(homePage.element.querySelector('[data-mode="cfop"]') as HTMLButtonElement).click()

    expect(homePage.element.textContent).toContain('CFOP 训练')
    expect(onModeSelect).toHaveBeenCalledWith('cfop', 3)
  })

  it('describes the current sticker keyboard interaction', () => {
    const homePage = createHomePage()

    expect(homePage.element.textContent).toContain('点击贴纸后')
    expect(homePage.element.textContent).toContain('方向键或 WASD')
    expect(homePage.element.textContent).not.toContain('R/L/U/D/F/B')
  })
})

describe('normalizeGameRoute', () => {
  it('accepts current game modes and supported cube sizes', () => {
    expect(normalizeGameRoute('#practice-2')).toEqual({ mode: 'practice', cubeSize: 2 })
    expect(normalizeGameRoute('#cfop-3')).toEqual({ mode: 'cfop', cubeSize: 3 })
    expect(normalizeGameRoute('#1v1-3')).toEqual({ mode: '1v1', cubeSize: 3 })
    expect(normalizeGameRoute('#coop-4')).toEqual({ mode: 'coop', cubeSize: 4 })
  })

  it('normalizes legacy battle routes to 1v1', () => {
    expect(normalizeGameRoute('#battle-3')).toEqual({ mode: '1v1', cubeSize: 3 })
  })

  it('rejects unsupported cube sizes and unknown modes', () => {
    expect(normalizeGameRoute('#practice-5')).toBeNull()
    expect(normalizeGameRoute('#cfop-2')).toBeNull()
    expect(normalizeGameRoute('#battle-5')).toBeNull()
    expect(normalizeGameRoute('#unknown-3')).toBeNull()
  })
})
