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
  currentRoom: null,
  players: [player],
  gameStarted: false,
  scramble: null,
  opponentMoves: [],
  gameResult: null,
}

describe('RoomPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders connection state, room code and players', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener(roomState)
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

  it('sends create, join, ready and leave actions through the store', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener(roomState)
      return () => undefined
    })
    vi.spyOn(useRoomStore, 'getState').mockReturnValue(roomState)
    const createRoom = vi.spyOn(useRoomStore, 'createRoom').mockImplementation(() => undefined)
    const joinRoom = vi.spyOn(useRoomStore, 'joinRoom').mockImplementation(() => undefined)
    const setReady = vi.spyOn(useRoomStore, 'setReady').mockImplementation(() => undefined)
    const leaveRoom = vi.spyOn(useRoomStore, 'leaveRoom').mockImplementation(() => undefined)

    const page = createRoomPage({ mode: 'coop', cubeSize: 4, onBack: vi.fn() })
    ;(page.element.querySelector('[data-action="create"]') as HTMLButtonElement).click()
    const input = page.element.querySelector('.room-code-input') as HTMLInputElement
    input.value = 'xyz789'
    ;(page.element.querySelector('.room-join-form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )
    ;(page.element.querySelector('[data-action="ready"]') as HTMLButtonElement).click()
    ;(page.element.querySelector('[data-action="leave"]') as HTMLButtonElement).click()

    expect(createRoom).toHaveBeenCalledWith('coop', { cubeSize: 4 })
    expect(joinRoom).toHaveBeenCalledWith('xyz789')
    expect(setReady).toHaveBeenCalledWith(true)
    expect(leaveRoom).toHaveBeenCalled()
  })

  it('shows room errors', () => {
    vi.spyOn(useRoomStore, 'attachClient').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'connect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'disconnect').mockImplementation(() => undefined)
    vi.spyOn(useRoomStore, 'subscribe').mockImplementation((listener) => {
      listener({ ...roomState, roomId: null, players: [], error: '房间不存在' })
      return () => undefined
    })

    const page = createRoomPage({ mode: '1v1', cubeSize: 3, onBack: vi.fn() })

    expect(page.element.textContent).toContain('房间不存在')
  })
})
