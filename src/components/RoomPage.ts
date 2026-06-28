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
        <div class="room-info-grid">
          <section class="room-panel">
            <h2>房间聊天</h2>
            <div class="room-chat-list" data-chat-list></div>
            <form class="room-chat-form">
              <input class="room-chat-input" maxlength="120" placeholder="发送消息" autocomplete="off" />
              <button class="room-secondary" type="submit">发送</button>
            </form>
          </section>
          <section class="room-panel">
            <h2>排行榜</h2>
            <div class="room-leaderboard" data-leaderboard></div>
          </section>
          <section class="room-panel">
            <h2>个人统计</h2>
            <div class="room-stats" data-player-stats></div>
          </section>
        </div>
        <div class="room-footer-actions">
          <button class="room-secondary" data-action="ready">准备</button>
          <button class="room-primary" data-action="start">开始协作</button>
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
    const readyButton = element.querySelector('[data-action="ready"]') as HTMLButtonElement
    const startButton = element.querySelector('[data-action="start"]') as HTMLButtonElement
    const currentPlayer = state.players.find((player) => player.id === state.currentPlayerId) ?? state.players[0]
    const isCoop = options.mode === 'coop'
    const canStartCoop = Boolean(isCoop && currentPlayer?.isHost && state.players.length >= 2 && !state.gameStarted)
    roomCard.hidden = !state.roomId
    roomActions.hidden = Boolean(state.roomId)
    matchButton.hidden = isCoop || state.isMatching
    cancelMatchButton.hidden = isCoop || !state.isMatching
    cancelMatchButton.textContent = state.isMatching ? '取消匹配（匹配中...）' : '取消匹配'
    readyButton.hidden = isCoop
    startButton.hidden = !isCoop || !currentPlayer?.isHost
    startButton.disabled = !canStartCoop
    startButton.textContent = state.players.length < 2 ? '等待队友' : '开始协作'
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
        <span>${player.name}${player.isHost ? '（房主）' : ''}${player.id === state.currentPlayerId ? '（我）' : ''}</span>
        <strong>${player.isReady ? '已准备' : '未准备'}</strong>
      </div>
    `).join('')

    const chatEl = element.querySelector('[data-chat-list]')!
    chatEl.innerHTML = state.chatMessages.length
      ? state.chatMessages.map((message) => `
        <div class="room-chat-message">
          <strong>${message.playerName}</strong>
          <span>${message.message}</span>
        </div>
      `).join('')
      : '<p class="room-empty">暂无消息</p>'

    const leaderboardEl = element.querySelector('[data-leaderboard]')!
    leaderboardEl.innerHTML = state.leaderboard.length
      ? state.leaderboard.slice(0, 5).map((row, index) => `
        <div class="room-rank-row">
          <span>#${index + 1} ${row.id}</span>
          <strong>${row.elo}</strong>
        </div>
      `).join('')
      : '<p class="room-empty">暂无排行</p>'

    const statsEl = element.querySelector('[data-player-stats]')!
    if (state.playerStats) {
      const winRate = state.playerStats.gamesPlayed > 0
        ? Math.round((state.playerStats.gamesWon / state.playerStats.gamesPlayed) * 100)
        : 0
      statsEl.innerHTML = `
        <div class="room-stat-row"><span>ELO</span><strong>${state.playerStats.elo}</strong></div>
        <div class="room-stat-row"><span>胜率</span><strong>${winRate}%</strong></div>
        <div class="room-stat-row"><span>最佳</span><strong>${state.playerStats.bestTime ?? '--'} ms</strong></div>
      `
    } else {
      statsEl.innerHTML = '<p class="room-empty">暂无统计</p>'
    }
  }

  const unsubscribe = useRoomStore.subscribe(render)
  useRoomStore.connect()
  void useRoomStore.loadLeaderboard()

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
    const state = useRoomStore.getState()
    const currentPlayer = state.players.find((player) => player.id === state.currentPlayerId) ?? state.players[0]
    useRoomStore.setReady(!currentPlayer?.isReady)
    if (currentPlayer) void useRoomStore.loadPlayerStats(currentPlayer.id)
  })
  element.querySelector('[data-action="start"]')?.addEventListener('click', () => {
    useRoomStore.startGame()
  })
  element.querySelector('.room-chat-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const input = element.querySelector('.room-chat-input') as HTMLInputElement
    useRoomStore.sendChatMessage(input.value)
    input.value = ''
  })

  return {
    element,
    destroy: () => {
      unsubscribe()
      useRoomStore.disconnect()
    },
  }
}
