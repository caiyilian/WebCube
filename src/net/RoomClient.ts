import { io, type Socket } from 'socket.io-client'
import type {
  ClientToServerEvents,
  GameMode,
  RoomSettings,
  ServerToClientEvents,
  Move,
} from '../../shared/types'

export interface LeaderboardRow {
  id: string
  elo: number
  gamesPlayed: number
  gamesWon: number
}

export interface RoomPlayerStats {
  elo: number
  gamesPlayed: number
  gamesWon: number
  bestTime: number | null
  totalTime: number
  history: Array<{ time: number; moves: number; date: number; won: boolean }>
}

export type RoomSocket = Socket<ServerToClientEvents, ClientToServerEvents>
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
export type RoomClientListener = (status: ConnectionStatus, error: string | null) => void
export type RoomSocketFactory = (url: string, options: { autoConnect: boolean; reconnection: boolean }) => RoomSocket

function getDefaultServerUrl(): string {
  const configuredUrl = import.meta.env.VITE_SERVER_URL as string | undefined
  if (configuredUrl) return configuredUrl
  if (!globalThis.location) return 'http://localhost:3000'
  return `${globalThis.location.protocol}//${globalThis.location.hostname}:3000`
}

export class RoomClient {
  private socket: RoomSocket | null = null
  private listeners = new Set<RoomClientListener>()
  private eventListeners: Array<{
    event: keyof ServerToClientEvents
    listener: ServerToClientEvents[keyof ServerToClientEvents]
  }> = []
  private status: ConnectionStatus = 'idle'
  private error: string | null = null

  constructor(
    private readonly url = getDefaultServerUrl(),
    private readonly socketFactory: RoomSocketFactory = io as RoomSocketFactory
  ) {}

  get connected(): boolean {
    return this.socket?.connected ?? false
  }

  get connectionStatus(): ConnectionStatus {
    return this.status
  }

  get lastError(): string | null {
    return this.error
  }

  get playerId(): string | null {
    return this.socket?.id ?? null
  }

  subscribe(listener: RoomClientListener): () => void {
    this.listeners.add(listener)
    listener(this.status, this.error)
    return () => this.listeners.delete(listener)
  }

  connect(): void {
    if (this.socket?.connected || this.status === 'connecting') return
    this.socket = this.socketFactory(this.url, { autoConnect: false, reconnection: true })
    this.setStatus('connecting', null)

    this.socket.on('connect', () => this.setStatus('connected', null))
    this.socket.on('disconnect', () => this.setStatus('disconnected', null))
    this.socket.on('connect_error', (error: Error) => this.setStatus('error', error.message))
    this.socket.on('room-error', (error) => this.setStatus('error', error))
    this.eventListeners.forEach(({ event, listener }) => {
      this.socket?.on(event, listener as never)
    })
    this.socket.connect()
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
    this.setStatus('disconnected', null)
  }

  on<EventName extends keyof ServerToClientEvents>(
    event: EventName,
    listener: ServerToClientEvents[EventName]
  ): () => void {
    const entry = { event, listener: listener as ServerToClientEvents[keyof ServerToClientEvents] }
    this.eventListeners.push(entry)
    this.socket?.on(event, listener as never)
    return () => {
      this.eventListeners = this.eventListeners.filter((item) => item !== entry)
      this.socket?.off(event, listener as never)
    }
  }

  emit<EventName extends keyof ClientToServerEvents>(
    event: EventName,
    ...args: Parameters<ClientToServerEvents[EventName]>
  ): void {
    this.socket?.emit(event, ...args)
  }

  createRoom(mode: GameMode, settings?: Partial<RoomSettings>): void {
    this.emit('create-room', { mode, settings })
  }

  joinRoom(roomId: string): void {
    this.emit('join-room', roomId)
  }

  leaveRoom(): void {
    this.emit('leave-room')
  }

  setReady(ready: boolean): void {
    this.emit('set-ready', ready)
  }

  startGame(): void {
    this.emit('start-game')
  }

  sendMove(move: Move): void {
    this.emit('move', move)
  }

  findMatch(mode: GameMode): void {
    this.emit('find-match', mode)
  }

  cancelMatch(): void {
    this.emit('cancel-match')
  }

  sendChatMessage(message: string): void {
    this.emit('chat-message', message)
  }

  async fetchLeaderboard(): Promise<LeaderboardRow[]> {
    const response = await fetch(`${this.url}/api/leaderboard`)
    if (!response.ok) throw new Error('排行榜加载失败')
    const data = await response.json() as { leaderboard: LeaderboardRow[] }
    return data.leaderboard
  }

  async fetchPlayerStats(playerId: string): Promise<RoomPlayerStats> {
    const response = await fetch(`${this.url}/api/stats/${encodeURIComponent(playerId)}`)
    if (!response.ok) throw new Error('个人统计加载失败')
    return await response.json() as RoomPlayerStats
  }

  private setStatus(status: ConnectionStatus, error: string | null): void {
    this.status = status
    this.error = error
    this.listeners.forEach((listener) => listener(status, error))
  }
}
