import { ReplayPlayer, type ReplayData } from '../game/ReplaySystem'
import { useGameStore, type Move } from '../stores/useGameStore'

export interface ReplayPanel {
  element: HTMLElement
  destroy: () => void
}

export interface ReplayPanelOptions {
  onResetView: () => void
  onReplayMove: (move: Move) => Promise<void> | void
}

function buildReplayData(): ReplayData {
  const state = useGameStore.getState()
  const moves = state.moveHistory.slice(0, state.moveHistoryIndex + 1)
  return {
    frames: moves.map((move, index) => ({ move, timestamp: index * state.animationDuration })),
    duration: moves.length > 0 ? (moves.length - 1) * state.animationDuration : 0,
    moveCount: moves.length,
  }
}

export function createReplayPanel(options: ReplayPanelOptions): ReplayPanel {
  const player = new ReplayPlayer()
  const element = document.createElement('aside')
  element.className = 'replay-panel'
  element.innerHTML = `
    <h2>回放</h2>
    <div class="replay-status" data-replay-status></div>
    <div class="replay-controls">
      <button class="room-secondary" data-action="replay-play">播放</button>
      <button class="room-secondary" data-action="replay-pause">暂停</button>
      <button class="room-secondary" data-action="replay-reset">重置</button>
      <select class="replay-speed" data-replay-speed aria-label="回放倍速">
        <option value="0.5">0.5×</option>
        <option value="1" selected>1×</option>
        <option value="2">2×</option>
      </select>
    </div>
  `

  const render = () => {
    const data = buildReplayData()
    player.loadReplay(data)
    element.querySelector('[data-replay-status]')!.textContent = data.moveCount > 0
      ? `${data.moveCount} 步可回放`
      : '暂无可回放步骤'
  }

  player.setCallbacks(
    (move) => {
      void options.onReplayMove(move)
      element.querySelector('[data-replay-status]')!.textContent = `${player.getCurrentIndex() + 1}/${player.getTotalFrames()}`
    },
    () => {
      element.querySelector('[data-replay-status]')!.textContent = '回放完成'
    }
  )

  element.querySelector('[data-action="replay-play"]')?.addEventListener('click', () => {
    options.onResetView()
    player.loadReplay(buildReplayData())
    player.play()
  })
  element.querySelector('[data-action="replay-pause"]')?.addEventListener('click', () => {
    player.pause()
  })
  element.querySelector('[data-action="replay-reset"]')?.addEventListener('click', () => {
    player.reset()
    options.onResetView()
    render()
  })
  element.querySelector('[data-replay-speed]')?.addEventListener('change', (event) => {
    player.setSpeed(Number((event.target as HTMLSelectElement).value))
  })

  render()
  const unsubscribe = useGameStore.subscribe(render)

  return {
    element,
    destroy: () => {
      player.pause()
      unsubscribe()
    },
  }
}
