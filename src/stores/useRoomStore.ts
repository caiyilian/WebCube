import { RoomClient, type ConnectionStatus } from '../net/RoomClient'
import type { Player, Room } from '../../shared/types'

export interface RoomState {
  connectionStatus: ConnectionStatus
  error: string | null
  currentRoom: Room | null
  roomId: string | null
  players: Player[]
}

type Listener = (state: RoomState) => void

class RoomStore {
  private state: RoomState = {
    connectionStatus: 'idle',
    error: null,
    currentRoom: null,
    roomId: null,
    players: [],
  }
  private listeners = new Set<Listener>()
  private client: RoomClient | null = null
  private unsubscribeClient: (() => void) | null = null

  getState(): RoomState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  attachClient(client: RoomClient): void {
    this.unsubscribeClient?.()
    this.client = client
    this.unsubscribeClient = client.subscribe((connectionStatus, error) => {
      this.setState({ connectionStatus, error })
    })

    client.on('room-created', (roomId) => this.setState({ roomId }))
    client.on('room-joined', (room) => this.setRoom(room))
    client.on('player-joined', (player) => this.setState({ players: [...this.state.players, player] }))
    client.on('player-left', (playerId) => {
      this.setState({ players: this.state.players.filter((player) => player.id !== playerId) })
    })
    client.on('room-error', (error) => this.setState({ error, connectionStatus: 'error' }))
  }

  connect(): void {
    this.client?.connect()
  }

  disconnect(): void {
    this.client?.disconnect()
    this.setState({ currentRoom: null, roomId: null, players: [] })
  }

  setRoom(room: Room): void {
    this.setState({
      currentRoom: room,
      roomId: room.id,
      players: room.players,
      error: null,
    })
  }

  clearError(): void {
    this.setState({ error: null })
  }

  private setState(partial: Partial<RoomState>): void {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((listener) => listener(this.state))
  }
}

export const useRoomStore = new RoomStore()
