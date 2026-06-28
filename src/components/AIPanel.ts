import { AIController, type AIDifficulty } from '../game/AIController'
import { useGameStore, type Move } from '../stores/useGameStore'

export interface AIPanel {
  element: HTMLElement
  destroy: () => void
}

function moveToToken(move: Move): string {
  return `${move.face}${move.direction === -1 ? "'" : ''}`
}

export function createAIPanel(): AIPanel {
  const ai = new AIController()
  let totalMoves = 0
  let completedMoves = 0

  const element = document.createElement('aside')
  element.className = 'ai-panel'
  element.innerHTML = `
    <h2>AI 对手</h2>
    <div class="ai-controls">
      <select class="ai-difficulty" data-ai-difficulty aria-label="AI 难度">
        <option value="easy">easy</option>
        <option value="medium" selected>medium</option>
        <option value="hard">hard</option>
      </select>
      <button class="room-secondary" data-action="ai-start">开始</button>
      <button class="room-secondary" data-action="ai-stop">停止</button>
    </div>
    <p class="ai-status" data-ai-status>请选择难度并开始 AI 对战</p>
  `

  const setStatus = (text: string) => {
    element.querySelector('[data-ai-status]')!.textContent = text
  }

  ai.setOnMove(() => {
    completedMoves += 1
    if (completedMoves >= totalMoves) {
      setStatus(`AI 完成：${completedMoves}/${totalMoves}`)
      return
    }
    const percent = totalMoves > 0 ? Math.round((completedMoves / totalMoves) * 100) : 0
    setStatus(`AI 进行中：${completedMoves}/${totalMoves}（${percent}%）`)
  })

  element.querySelector('[data-action="ai-start"]')?.addEventListener('click', () => {
    const difficulty = (element.querySelector('[data-ai-difficulty]') as HTMLSelectElement).value as AIDifficulty
    const opponent = ai.createAI(difficulty)
    useGameStore.scramble(20)
    const moves = useGameStore.getState().moveHistory.slice(0, useGameStore.getState().moveHistoryIndex + 1)
    const scramble = moves.map(moveToToken).join(' ')
    totalMoves = Math.max(1, moves.length)
    completedMoves = 0
    setStatus(`${opponent.name} 已开始：0/${totalMoves}`)
    ai.startSolving(scramble)
  })

  element.querySelector('[data-action="ai-stop"]')?.addEventListener('click', () => {
    if (ai.isSolving()) ai.stopSolving()
    setStatus('AI 已停止')
  })

  return {
    element,
    destroy: () => {
      if (ai.isSolving()) ai.stopSolving()
    },
  }
}
