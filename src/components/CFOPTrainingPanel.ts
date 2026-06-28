import { detectCFOPProgress, getCFOPStepDescription, type CFOPStep } from '../game/CFOPDetector'
import { useGameStore } from '../stores/useGameStore'

const steps: Array<{ key: Exclude<CFOPStep, 'solved'>; label: string }> = [
  { key: 'cross', label: 'Cross' },
  { key: 'f2l', label: 'F2L' },
  { key: 'oll', label: 'OLL' },
  { key: 'pll', label: 'PLL' },
]

export interface CFOPTrainingPanel {
  element: HTMLElement
  destroy: () => void
}

export function createCFOPTrainingPanel(): CFOPTrainingPanel {
  const element = document.createElement('aside')
  element.className = 'cfop-panel'
  element.innerHTML = `
    <h2>CFOP 训练</h2>
    <div class="cfop-steps" data-cfop-steps></div>
    <p class="cfop-next" data-cfop-next></p>
  `

  const render = () => {
    const progress = detectCFOPProgress(useGameStore.getState().cubeState)
    const stepsEl = element.querySelector('[data-cfop-steps]')!
    stepsEl.innerHTML = steps.map((step) => {
      const done = progress[step.key]
      return `
        <div class="cfop-step ${done ? 'is-done' : ''}" data-step="${step.key}">
          <span>${step.label}</span>
          <strong>${done ? '已完成' : '训练中'}</strong>
        </div>
      `
    }).join('')

    const nextText = progress.currentStep === 'solved'
      ? '全部阶段已完成'
      : `下一目标：${getCFOPStepDescription(progress.currentStep)}`
    element.querySelector('[data-cfop-next]')!.textContent = nextText
  }

  render()
  const unsubscribe = useGameStore.subscribe(render)

  return {
    element,
    destroy: unsubscribe,
  }
}
