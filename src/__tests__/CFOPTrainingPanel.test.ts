import { afterEach, describe, expect, it } from 'vitest'
import { createCFOPTrainingPanel } from '../components/CFOPTrainingPanel'
import { useGameStore } from '../stores/useGameStore'

describe('CFOPTrainingPanel', () => {
  afterEach(() => {
    useGameStore.resetCube()
  })

  it('renders CFOP progress and next training target', () => {
    useGameStore.setCubeSize(3)
    const panel = createCFOPTrainingPanel()

    expect(panel.element.textContent).toContain('CFOP 训练')
    expect(panel.element.textContent).toContain('Cross')
    expect(panel.element.textContent).toContain('F2L')
    expect(panel.element.textContent).toContain('OLL')
    expect(panel.element.textContent).toContain('PLL')
    expect(panel.element.textContent).toContain('已完成')
    expect(panel.element.textContent).toContain('全部阶段已完成')

    panel.destroy()
  })
})
