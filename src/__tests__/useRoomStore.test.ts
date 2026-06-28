import { describe, expect, it } from 'vitest'
import { RoomClient, type RoomSocket } from '../net/RoomClient'
import { useRoomStore } from '../stores/useRoomStore'
import type { Player, Room } from '../../shared/types'

class FakeSocket {
  public connected = false
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

  emit(): this {
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
  it('tracks connection and room state from RoomClient', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)

    useRoomStore.attachClient(client)
    useRoomStore.connect()
    socket.trigger('room-joined', room)

    expect(useRoomStore.getState().connectionStatus).toBe('connected')
    expect(useRoomStore.getState().roomId).toBe('ABC123')
    expect(useRoomStore.getState().players).toEqual([player])
  })
})
