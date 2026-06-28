import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoomPage } from '../components/RoomPage'
import { useRoomStore, type RoomState } from '../stores/useRoomStore'
import type { Player } from '../../shared/types'

const player: Player = {
  id: 'p1',
  name: 'Alice',
  color: '#fff',
  isHost: true,
  isReady: false,
  moveCount: 0,
  solveTime: null,
  hintsUsed: 0,
}

const roomState: RoomState = {
  connectionStatus: 'connected',
  error: null,
  roomId: 'ABC123',
  currentPlayerId: 'p1',
  currentRoom: null,
  players: [player],
  gameStarted: false,
  scramble: null,
  sharedCubeState: null,
  turnMode: false,
  currentTurn: null,
  opponentMoves: [],
  gameResult: null,
  isMatching: false,
  matchStartedAt: null,
  chatMessages: [],
  leaderboard: [],
  playerStats: null,
}

describe('RoomPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders connection state, room code and players', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    const teammate: Player = { ...player, id: 'p2', name: 'Bob', isHost: false }
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({ ...roomState, players: [player, teammate] })
      return () => undefined
    })

    const page = createRoomPage({ mode: '1v1', cubeSize: 3, onBack: vi.fn() })

    expect(page.element.textContent).toContain('1v1 对战房间')
    expect(page.element.textContent).toContain('已连接')
    expect(page.element.textContent).toContain('ABC123')
    expect(page.element.textContent).toContain('Alice（房主）')
    expect(page.element.textContent).toContain('未准备')
    expect(page.element.textContent).toContain('等待玩家准备')
  })

  it('renders active game and result states', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({ ...roomState, gameStarted: true, scramble: "R U R'" })
      listener({
        ...roomState,
        gameResult: {
          winner: 'p1',
          players: [{ id: 'p1', name: 'Alice', moveCount: 8, solveTime: 1000, eloChange: 16 }],
          scramble: "R U R'",
          duration: 1000,
        },
      })
      return () => undefined
    })

    const page = createRoomPage({ mode: '1v1', cubeSize: 3, onBack: vi.fn() })

    expect(page.element.textContent).toContain('比赛结束，胜者：Alice')
  })

  it('sends create, join, match, ready and leave actions through the store', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    const teammate: Player = { ...player, id: 'p2', name: 'Bob', isHost: false }
    const coopState = { ...roomState, players: [player, teammate] }
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener(coopState)
      return () => undefined
    })
    vi.spyOn(useRoomStore, 'getState').mockReturnValue(coopState)
    const createRoom = vi.spyOn(useRoomStore, 'createRoom').mockImplementation(() => undefined)
    const joinRoom = vi.spyOn(useRoomStore, 'joinRoom').mockImplementation(() => undefined)
    const setReady = vi.spyOn(useRoomStore, 'setReady').mockImplementation(() => undefined)
    const startGame = vi.spyOn(useRoomStore, 'startGame').mockImplementation(() => undefined)
    const leaveRoom = vi.spyOn(useRoomStore, 'leaveRoom').mockImplementation(() => undefined)
    const findMatch = vi.spyOn(useRoomStore, 'findMatch').mockImplementation(() => undefined)
    const cancelMatch = vi.spyOn(useRoomStore, 'cancelMatch').mockImplementation(() => undefined)

    const page = createRoomPage({ mode: 'coop', cubeSize: 4, onBack: vi.fn() })
    ;(page.element.querySelector('[data-action="create"]') as HTMLButtonElement).click()
    ;(page.element.querySelector('[data-action="match"]') as HTMLButtonElement).click()
    ;(page.element.querySelector('[data-action="cancel-match"]') as HTMLButtonElement).click()
    const input = page.element.querySelector('.room-code-input') as HTMLInputElement
    input.value = 'xyz789'
    ;(page.element.querySelector('.room-join-form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )
    ;(page.element.querySelector('[data-action="ready"]') as HTMLButtonElement).click()
    ;(page.element.querySelector('[data-action="start"]') as HTMLButtonElement).click()
    ;(page.element.querySelector('[data-action="leave"]') as HTMLButtonElement).click()

    expect(createRoom).toHaveBeenCalledWith('coop', { cubeSize: 4 })
    expect(findMatch).toHaveBeenCalledWith('coop')
    expect(cancelMatch).toHaveBeenCalled()
    expect(joinRoom).toHaveBeenCalledWith('xyz789')
    expect(setReady).toHaveBeenCalledWith(true)
    expect(startGame).toHaveBeenCalled()
    expect(leaveRoom).toHaveBeenCalled()
  })

  it('shows coop start only for the host when enough players joined', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    const teammate: Player = { ...player, id: 'p2', name: 'Bob', isHost: false }
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({ ...roomState, players: [player, teammate] })
      return () => undefined
    })

    const page = createRoomPage({ mode: 'coop', cubeSize: 3, onBack: vi.fn() })
    const startButton = page.element.querySelector('[data-action="start"]') as HTMLButtonElement
    const readyButton = page.element.querySelector('[data-action="ready"]') as HTMLButtonElement

    expect(page.element.textContent).toContain('协作房间')
    expect(startButton.hidden).toBe(false)
    expect(startButton.disabled).toBe(false)
    expect(readyButton.hidden).toBe(true)
  })

  it('hides coop start from non-host players', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    const teammate: Player = { ...player, id: 'p2', name: 'Bob', isHost: false }
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({ ...roomState, currentPlayerId: 'p2', players: [player, teammate] })
      return () => undefined
    })

    const page = createRoomPage({ mode: 'coop', cubeSize: 3, onBack: vi.fn() })
    const startButton = page.element.querySelector('[data-action="start"]') as HTMLButtonElement

    expect(page.element.textContent).toContain('Bob（我）')
    expect(startButton.hidden).toBe(true)
  })

  it('shows coop turn mode controls and sends mode changes', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    const teammate: Player = { ...player, id: 'p2', name: 'Bob', isHost: false }
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({ ...roomState, players: [player, teammate], turnMode: true, currentTurn: 'p2' })
      return () => undefined
    })
    const setTurnMode = vi.spyOn(useRoomStore, 'setTurnMode').mockImplementation(() => undefined)

    const page = createRoomPage({ mode: 'coop', cubeSize: 3, onBack: vi.fn() })
    ;(page.element.querySelector('[data-action="free-mode"]') as HTMLButtonElement).click()

    expect(page.element.textContent).toContain('轮流模式：当前轮到 Bob，你暂不可操作')
    expect(setTurnMode).toHaveBeenCalledWith(false)
  })

  it('shows room errors', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({ ...roomState, roomId: null, players: [], error: '房间不存在' })
      return () => undefined
    })

    const page = createRoomPage({ mode: '1v1', cubeSize: 3, onBack: vi.fn() })

    expect(page.element.textContent).toContain('房间不存在')
  })

  it('shows matching state and cancel action', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({ ...roomState, roomId: null, players: [], isMatching: true })
      return () => undefined
    })

    const page = createRoomPage({ mode: '1v1', cubeSize: 3, onBack: vi.fn() })

    expect(page.element.textContent).toContain('取消匹配（匹配中...）')
  })

  it('renders chat, leaderboard, stats and sends chat messages', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'loadLeaderboard').mockResolvedValue(undefined)
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({
        ...roomState,
        chatMessages: [{
          id: 'm1',
          playerId: 'p1',
          playerName: 'Alice',
          playerColor: '#fff',
          message: '你好',
          timestamp: 1,
        }],
        leaderboard: [{ id: 'p1', elo: 1216, gamesPlayed: 1, gamesWon: 1 }],
        playerStats: { elo: 1216, gamesPlayed: 1, gamesWon: 1, bestTime: 1000, totalTime: 1000, history: [] },
      })
      return () => undefined
    })
    const sendChatMessage = vi.spyOn(useRoomStore, 'sendChatMessage').mockImplementation(() => undefined)

    const page = createRoomPage({ mode: '1v1', cubeSize: 3, onBack: vi.fn() })
    const input = page.element.querySelector('.room-chat-input') as HTMLInputElement
    input.value = '开局！'
    ;(page.element.querySelector('.room-chat-form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )

    expect(page.element.textContent).toContain('你好')
    expect(page.element.textContent).toContain('1216')
    expect(page.element.textContent).toContain('100%')
    expect(sendChatMessage).toHaveBeenCalledWith('开局！')
    expect(input.value).toBe('')
  })
})
