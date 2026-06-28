import { RoomClient } from '../net/RoomClient'
import { useRoomStore, type RoomState } from '../stores/useRoomStore'
import type { CubeSize } from '../stores/useGameStore'
import type { GameMode } from '../../shared/types'

export interface RoomPageOptions {
  mode: Exclude<GameMode, 'practice'>
  cubeSize: CubeSize
  onBack: () => void
}

export interface RoomPage {
  element: HTMLElement
  destroy: () => void
}

const modeTitle: Record<Exclude<GameMode, 'practice'>, string> = {
  '1v1': '1v1 对战房间',
  coop: '协作房间',
}

function statusText(status: RoomState['connectionStatus']): string {
  const text: Record<RoomState['connectionStatus'], string> = {
    idle: '未连接',
    connecting: '连接中',
    connected: '已连接',
    disconnected: '已断开',
    error: '连接异常',
  }
  return text[status]
}

export function createRoomPage(options: RoomPageOptions): RoomPage {
  const roomClient = new RoomClient()
  useRoomStore.attachClient(roomClient)

  const element = document.createElement('div')
  element.className = 'room-page'
  element.innerHTML = `
    <div class="room-shell">
      <div class="room-header">
        <button class="room-back" data-action="back">返回</button>
        <div>
          <h1>${modeTitle[options.mode]}</h1>
          <p>${options.cubeSize}×${options.cubeSize} 魔方</p>
        </div>
        <span class="room-status" data-room-status>未连接</span>
      </div>

      <div class="room-actions" data-room-actions>
        <button class="room-primary" data-action="create">创建房间</button>
        <button class="room-secondary" data-action="match">随机匹配</button>
        <button class="room-secondary" data-action="cancel-match" hidden>取消匹配</button>
        <form class="room-join-form">
          <input class="room-code-input" maxlength="6" placeholder="输入房间码" autocomplete="off" />
          <button class="room-secondary" type="submit">加入</button>
        </form>
      </div>

      <div class="room-error" data-room-error></div>

      <section class="room-card" data-room-card hidden>
        <div class="room-code">
          <span>房间码</span>
          <strong data-room-code>------</strong>
        </div>
        <div class="room-game-state" data-game-state></div>
        <div class="room-player-list" data-player-list></div>
        <div class="room-footer-actions">
          <button class="room-secondary" data-action="ready">准备</button>
          <button class="room-danger" data-action="leave">离开房间</button>
        </div>
      </section>
    </div>
  `

  const render = (state: RoomState) => {
    element.querySelector('[data-room-status]')!.textContent = statusText(state.connectionStatus)
    element.querySelector('[data-room-error]')!.textContent = state.error ?? ''
    const roomCard = element.querySelector('[data-room-card]') as HTMLElement
    const roomActions = element.querySelector('[data-room-actions]') as HTMLElement
    const matchButton = element.querySelector('[data-action="match"]') as HTMLButtonElement
    const cancelMatchButton = element.querySelector('[data-action="cancel-match"]') as HTMLButtonElement
    roomCard.hidden = !state.roomId
    roomActions.hidden = Boolean(state.roomId)
    matchButton.hidden = state.isMatching
    cancelMatchButton.hidden = !state.isMatching
    cancelMatchButton.textContent = state.isMatching ? '取消匹配（匹配中...）' : '取消匹配'
    element.querySelector('[data-room-code]')!.textContent = state.roomId ?? '------'
    const gameStateEl = element.querySelector('[data-game-state]')!
    if (state.gameResult) {
      const winner = state.gameResult.players.find((player) => player.id === state.gameResult?.winner)
      gameStateEl.textContent = `比赛结束，胜者：${winner?.name ?? state.gameResult.winner ?? '无'}`
    } else if (state.gameStarted) {
      gameStateEl.textContent = `比赛进行中，打乱：${state.scramble ?? ''}`
    } else {
      gameStateEl.textContent = '等待玩家准备'
    }

    const playersEl = element.querySelector('[data-player-list]')!
    playersEl.innerHTML = state.players.map((player) => `
      <div class="room-player">
        <span>${player.name}${player.isHost ? '（房主）' : ''}</span>
        <strong>${player.isReady ? '已准备' : '未准备'}</strong>
      </div>
    `).join('')
  }

  const unsubscribe = useRoomStore.subscribe(render)
  useRoomStore.connect()

  element.querySelector('[data-action="back"]')?.addEventListener('click', options.onBack)
  element.querySelector('[data-action="create"]')?.addEventListener('click', () => {
    useRoomStore.createRoom(options.mode, { cubeSize: options.cubeSize })
  })
  element.querySelector('[data-action="match"]')?.addEventListener('click', () => {
    useRoomStore.findMatch(options.mode)
  })
  element.querySelector('[data-action="cancel-match"]')?.addEventListener('click', () => {
    useRoomStore.cancelMatch()
  })
  element.querySelector('.room-join-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const input = element.querySelector('.room-code-input') as HTMLInputElement
    useRoomStore.joinRoom(input.value)
  })
  element.querySelector('[data-action="leave"]')?.addEventListener('click', () => {
    useRoomStore.leaveRoom()
  })
  element.querySelector('[data-action="ready"]')?.addEventListener('click', () => {
    const currentPlayer = useRoomStore.getState().players[0]
    useRoomStore.setReady(!currentPlayer?.isReady)
  })

  return {
    element,
    destroy: () => {
      unsubscribe()
      useRoomStore.disconnect()
    },
  }
}
