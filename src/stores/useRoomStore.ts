import { RoomClient, type ConnectionStatus } from '../net/RoomClient'
import type { GameMode, GameResult, Move, Player, Room, RoomSettings } from '../../shared/types'

export interface RoomState {
  connectionStatus: ConnectionStatus
  error: string | null
  currentRoom: Room | null
  roomId: string | null
  players: Player[]
  gameStarted: boolean
  scramble: string | null
  opponentMoves: Move[]
  gameResult: GameResult | null
  isMatching: boolean
  matchStartedAt: number | null
}

type Listener = (state: RoomState) => void

class RoomStore {
  private state: RoomState = {
    connectionStatus: 'idle',
    error: null,
    currentRoom: null,
    roomId: null,
    players: [],
    gameStarted: false,
    scramble: null,
    opponentMoves: [],
    gameResult: null,
    isMatching: false,
    matchStartedAt: null,
  }
  private listeners = new Set<Listener>()
  private client: RoomClient | null = null
  private unsubscribeClient: (() => void) | null = null
  private matchTimeout: ReturnType<typeof setTimeout> | null = null

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
    client.on('player-ready', (playerId) => {
      this.setState({
        players: this.state.players.map((player) =>
          player.id === playerId ? { ...player, isReady: true } : player
        ),
      })
    })
    client.on('room-error', (error) => this.setState({ error, connectionStatus: 'error' }))
    client.on('game-start', ({ scramble, players }) => {
      this.setState({ gameStarted: true, scramble, players, gameResult: null, error: null })
    })
    client.on('opponent-move', (move) => {
      this.setState({ opponentMoves: [...this.state.opponentMoves, move] })
    })
    client.on('game-end', (gameResult) => {
      this.setState({ gameStarted: false, gameResult })
    })
    client.on('match-found', (roomId) => {
      this.clearMatchTimeout()
      this.setState({ isMatching: false, matchStartedAt: null, roomId, error: null })
    })
    client.on('match-cancelled', () => {
      this.clearMatchTimeout()
      this.setState({ isMatching: false, matchStartedAt: null, error: '已取消匹配' })
    })
  }

  connect(): void {
    this.client?.connect()
  }

  createRoom(mode: GameMode, settings?: Partial<RoomSettings>): void {
    this.client?.connect()
    this.client?.createRoom(mode, settings)
  }

  joinRoom(roomId: string): void {
    this.client?.connect()
    this.client?.joinRoom(roomId.trim().toUpperCase())
  }

  disconnect(): void {
    this.client?.disconnect()
    this.setState({
      currentRoom: null,
      roomId: null,
      players: [],
      gameStarted: false,
      scramble: null,
      opponentMoves: [],
      gameResult: null,
      isMatching: false,
      matchStartedAt: null,
    })
  }

  leaveRoom(): void {
    this.client?.leaveRoom()
    this.setState({
      currentRoom: null,
      roomId: null,
      players: [],
      gameStarted: false,
      scramble: null,
      opponentMoves: [],
      gameResult: null,
      isMatching: false,
      matchStartedAt: null,
    })
  }

  setReady(ready: boolean): void {
    this.client?.setReady(ready)
    const [currentPlayer] = this.state.players
    if (currentPlayer) {
      this.setState({
        players: this.state.players.map((player, index) =>
          index === 0 ? { ...player, isReady: ready } : player
        ),
      })
    }
  }

  sendMove(move: Move): void {
    this.client?.sendMove(move)
  }

  findMatch(mode: GameMode): void {
    this.client?.connect()
    this.client?.findMatch(mode)
    this.setState({ isMatching: true, matchStartedAt: Date.now(), error: null })
    this.clearMatchTimeout()
    this.matchTimeout = setTimeout(() => {
      this.client?.cancelMatch()
      this.setState({ isMatching: false, matchStartedAt: null, error: '匹配超时，请稍后重试' })
    }, 30000)
  }

  cancelMatch(): void {
    this.client?.cancelMatch()
    this.clearMatchTimeout()
    this.setState({ isMatching: false, matchStartedAt: null, error: '已取消匹配' })
  }

  reset(): void {
    this.clearMatchTimeout()
    this.unsubscribeClient?.()
    this.unsubscribeClient = null
    this.client = null
    this.setState({
      connectionStatus: 'idle',
      error: null,
      currentRoom: null,
      roomId: null,
      players: [],
      gameStarted: false,
      scramble: null,
      opponentMoves: [],
      gameResult: null,
      isMatching: false,
      matchStartedAt: null,
    })
  }

  setRoom(room: Room): void {
    this.setState({
      currentRoom: room,
      roomId: room.id,
      players: room.players,
      error: null,
      gameStarted: false,
      scramble: null,
      opponentMoves: [],
      gameResult: null,
      isMatching: false,
      matchStartedAt: null,
    })
  }

  clearError(): void {
    this.setState({ error: null })
  }

  private setState(partial: Partial<RoomState>): void {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((listener) => listener(this.state))
  }

  private clearMatchTimeout(): void {
    if (this.matchTimeout) clearTimeout(this.matchTimeout)
    this.matchTimeout = null
  }
}

export const useRoomStore = new RoomStore()
