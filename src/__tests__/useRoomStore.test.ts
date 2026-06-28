import { afterEach, describe, expect, it } from 'vitest'
import { RoomClient, type RoomSocket } from '../net/RoomClient'
import { useRoomStore } from '../stores/useRoomStore'
import type { CubeState, Player, Room } from '../../shared/types'

class FakeSocket {
  public connected = false
  public id = 'p1'
  public emitted: Array<{ event: string; args: unknown[] }> = []
  private handlers = new Map<string, Set<(...args: never[]) => void>>()

  on(event: string, handler: (...args: never[]) => void): this {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return this
  }

  off(event: string, handler: (...args: never[]) => void): this {
    this.handlers.get(event)?.delete(handler)
    return this
  }

  emit(event: string, ...args: unknown[]): this {
    this.emitted.push({ event, args })
    return this
  }

  connect(): this {
    this.connected = true
    this.trigger('connect')
    return this
  }

  disconnect(): this {
    this.connected = false
    this.trigger('disconnect')
    return this
  }

  trigger(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach((handler) => handler(...(args as never[])))
  }
}

const player: Player = {
  id: 'p1',
  name: 'Player',
  color: '#fff',
  isHost: true,
  isReady: false,
  moveCount: 0,
  solveTime: null,
  hintsUsed: 0,
}

const sharedCubeState: CubeState = {
  U: Array(9).fill('white'),
  D: Array(9).fill('yellow'),
  F: Array(9).fill('green'),
  B: Array(9).fill('blue'),
  L: Array(9).fill('orange'),
  R: Array(9).fill('red'),
}

const room: Room = {
  id: 'ABC123',
  mode: '1v1',
  host: 'p1',
  players: [player],
  spectators: [],
  maxPlayers: 2,
  scramble: null,
  status: 'waiting',
  createdAt: Date.now(),
  settings: {
    hintEnabled: false,
    maxHints: 3,
    timeLimit: null,
    chatEnabled: true,
  },
}

describe('useRoomStore', () => {
  afterEach(() => {
    useRoomStore.reset()
  })

  it('tracks connection and room state from RoomClient', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)

    useRoomStore.attachClient(client)
    useRoomStore.connect()
    socket.trigger('room-joined', room)

    expect(useRoomStore.getState().connectionStatus).toBe('connected')
    expect(useRoomStore.getState().roomId).toBe('ABC123')
    expect(useRoomStore.getState().currentPlayerId).toBe('p1')
    expect(useRoomStore.getState().players).toEqual([player])
  })

  it('stores shared cube state from joined rooms and sync events', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)
    const updatedState: CubeState = { ...sharedCubeState, F: Array(9).fill('red') }

    useRoomStore.attachClient(client)
    useRoomStore.connect()
    socket.trigger('room-joined', { ...room, mode: 'coop', sharedCubeState })
    expect(useRoomStore.getState().sharedCubeState).toEqual(sharedCubeState)

    socket.trigger('cube-update', updatedState)
    expect(useRoomStore.getState().sharedCubeState).toEqual(updatedState)

    socket.trigger('sync-state', sharedCubeState)
    expect(useRoomStore.getState().sharedCubeState).toEqual(sharedCubeState)
  })

  it('tracks 1v1 game events', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)

    useRoomStore.attachClient(client)
    useRoomStore.connect()
    socket.trigger('game-start', { scramble: "R U R'", mode: '1v1', players: [player], cubeState: sharedCubeState })
    socket.trigger('opponent-move', { face: 'R', direction: 1 })
    socket.trigger('game-end', {
      winner: 'p1',
      players: [{ id: 'p1', name: 'Player', moveCount: 10, solveTime: 1000, eloChange: 16 }],
      scramble: "R U R'",
      duration: 1000,
    })

    expect(useRoomStore.getState().scramble).toBe("R U R'")
    expect(useRoomStore.getState().sharedCubeState).toEqual(sharedCubeState)
    expect(useRoomStore.getState().opponentMoves).toEqual([{ face: 'R', direction: 1 }])
    expect(useRoomStore.getState().gameStarted).toBe(false)
    expect(useRoomStore.getState().gameResult?.winner).toBe('p1')
  })

  it('tracks matchmaking events', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)

    useRoomStore.attachClient(client)
    useRoomStore.findMatch('1v1')
    expect(useRoomStore.getState().isMatching).toBe(true)

    socket.trigger('match-found', 'MATCH1')
    expect(useRoomStore.getState().isMatching).toBe(false)
    expect(useRoomStore.getState().roomId).toBe('MATCH1')

    useRoomStore.findMatch('1v1')
    socket.trigger('match-cancelled')
    expect(useRoomStore.getState().isMatching).toBe(false)
    expect(useRoomStore.getState().error).toBe('已取消匹配')
  })

  it('sends start game and updates the current player ready state', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)

    useRoomStore.attachClient(client)
    useRoomStore.connect()
    socket.trigger('room-joined', room)
    useRoomStore.setReady(true)
    useRoomStore.startGame()

    expect(useRoomStore.getState().players[0].isReady).toBe(true)
    expect(socket.emitted).toContainEqual({ event: 'set-ready', args: [true] })
    expect(socket.emitted).toContainEqual({ event: 'start-game', args: [] })
  })

  it('tracks coop turn mode and blocks non-current player moves locally', () => {
    const socket = new FakeSocket()
    socket.id = 'p2'
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)
    const teammate: Player = { ...player, id: 'p2', name: 'Teammate', isHost: false }

    useRoomStore.attachClient(client)
    useRoomStore.connect()
    socket.trigger('room-joined', { ...room, mode: 'coop', players: [player, teammate], turnMode: true, currentTurn: 'p1' })
    useRoomStore.sendCoopMove({ face: 'R', direction: 1 })

    expect(useRoomStore.getState().error).toBe('轮流模式下还没轮到你')
    expect(socket.emitted).not.toContainEqual({ event: 'coop-move', args: [{ face: 'R', direction: 1 }] })

    socket.trigger('turn-changed', 'p2')
    useRoomStore.sendCoopMove({ face: 'R', direction: 1 })
    useRoomStore.setTurnMode(false)

    expect(socket.emitted).toContainEqual({ event: 'coop-move', args: [{ face: 'R', direction: 1 }] })
    expect(socket.emitted).toContainEqual({ event: 'set-turn-mode', args: [false] })
  })

  it('applies turn mode socket events', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)

    useRoomStore.attachClient(client)
    useRoomStore.connect()
    socket.trigger('turn-mode-changed', true, 'p1')
    socket.trigger('timer-sync', 2345)
    socket.trigger('turn-error', '只有房主可以切换轮流规则')

    expect(useRoomStore.getState().turnMode).toBe(true)
    expect(useRoomStore.getState().currentTurn).toBe('p1')
    expect(useRoomStore.getState().teamElapsed).toBe(2345)
    expect(useRoomStore.getState().error).toBe('只有房主可以切换轮流规则')
  })
})
