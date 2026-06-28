import { describe, expect, it, vi } from 'vitest'
import { RoomClient, type RoomSocket } from '../net/RoomClient'

class FakeSocket {
  public connected = false
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

describe('RoomClient', () => {
  it('tracks connection lifecycle', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)
    const listener = vi.fn()
    client.subscribe(listener)

    client.connect()

    expect(client.connected).toBe(true)
    expect(client.connectionStatus).toBe('connected')
    expect(listener).toHaveBeenLastCalledWith('connected', null)

    client.disconnect()

    expect(client.connectionStatus).toBe('disconnected')
  })

  it('emits typed room commands', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)

    client.connect()
    client.createRoom('1v1')
    client.joinRoom('ABC123')
    client.setReady(true)
    client.sendMove({ face: 'R', direction: 1 })
    client.findMatch('1v1')
    client.cancelMatch()

    expect(socket.emitted).toEqual([
      { event: 'create-room', args: [{ mode: '1v1', settings: undefined }] },
      { event: 'join-room', args: ['ABC123'] },
      { event: 'set-ready', args: [true] },
      { event: 'move', args: [{ face: 'R', direction: 1 }] },
      { event: 'find-match', args: ['1v1'] },
      { event: 'cancel-match', args: [] },
    ])
  })

  it('surfaces connection and room errors', () => {
    const socket = new FakeSocket()
    const client = new RoomClient('http://localhost:3000', () => socket as unknown as RoomSocket)

    client.connect()
    socket.trigger('room-error', '房间不存在')

    expect(client.connectionStatus).toBe('error')
    expect(client.lastError).toBe('房间不存在')
  })
})
