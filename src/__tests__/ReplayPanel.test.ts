import { afterEach, describe, expect, it, vi } from 'vitest'
import { createReplayPanel } from '../components/ReplayPanel'
import { useGameStore } from '../stores/useGameStore'

describe('ReplayPanel', () => {
  afterEach(() => {
    useGameStore.resetCube()
    vi.restoreAllMocks()
  })

  it('shows recorded moves and controls playback', () => {
    useGameStore.setCubeSize(3)
    useGameStore.applyMove({ face: 'R', direction: 1 })
    const onResetView = vi.fn()
    const onReplayMove = vi.fn()

    const panel = createReplayPanel({ onResetView, onReplayMove })
    ;(panel.element.querySelector('[data-action="replay-play"]') as HTMLButtonElement).click()
    ;(panel.element.querySelector('[data-action="replay-reset"]') as HTMLButtonElement).click()

    expect(panel.element.textContent).toContain('1 步可回放')
    expect(onResetView).toHaveBeenCalled()
    expect(onReplayMove).toHaveBeenCalledWith({ face: 'R', direction: 1 })

    panel.destroy()
  })

  it('shows an empty replay state', () => {
    useGameStore.setCubeSize(3)
    const panel = createReplayPanel({ onResetView: vi.fn(), onReplayMove: vi.fn() })

    expect(panel.element.textContent).toContain('暂无可回放步骤')

    panel.destroy()
  })
})
