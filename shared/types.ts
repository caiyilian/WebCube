// Shared types between client and server

export interface CubeState {
  U: string[]
  D: string[]
  F: string[]
  B: string[]
  L: string[]
  R: string[]
}

export type MoveFace = 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
export type MoveDirection = 1 | -1

export interface Move {
  face: MoveFace
  direction: MoveDirection
  axis?: 'x' | 'y' | 'z'
  layer?: number
  timestamp?: number
}

export type GameMode = 'practice' | '1v1' | 'coop'

export interface RoomSettings {
  hintEnabled: boolean
  maxHints: number
  timeLimit: number | null
  chatEnabled: boolean
}

export interface Room {
  id: string
  mode: GameMode
  host: string
  players: Player[]
  spectators: string[]
  maxPlayers: number
  scramble: string | null
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
  settings: RoomSettings
  sharedCubeState?: CubeState
}

export interface Player {
  id: string
  name: string
  color: string
  isHost: boolean
  isReady: boolean
  cubeState?: CubeState
  moveCount: number
  solveTime: number | null
  hintsUsed: number
  elo?: number
}

export interface GameResult {
  winner: string | null // null for draw
  players: Array<{
    id: string
    name: string
    moveCount: number
    solveTime: number | null
    eloChange: number
  }>
  scramble: string
  duration: number
}

// Socket events
export interface ServerToClientEvents {
  // Room events
  'room-created': (roomId: string) => void
  'room-joined': (room: Room) => void
  'player-joined': (player: Player) => void
  'player-left': (playerId: string) => void
  'room-error': (error: string) => void
  'room-list': (rooms: Room[]) => void

  // Game events
  'game-start': (data: { scramble: string; mode: GameMode; players: Player[] }) => void
  'game-end': (result: GameResult) => void
  'opponent-move': (move: Move) => void
  'cube-update': (cubeState: CubeState) => void
  'player-ready': (playerId: string) => void
  'timer-sync': (serverTime: number) => void

  // Matchmaking
  'match-found': (roomId: string) => void
  'match-cancelled': () => void

  // Chat
  'chat-message': (message: ChatMessage) => void

  // WebRTC
  'webrtc-offer': (data: { from: string; offer: RTCSessionDescriptionInit }) => void
  'webrtc-answer': (data: { from: string; answer: RTCSessionDescriptionInit }) => void
  'webrtc-ice-candidate': (data: { from: string; candidate: RTCIceCandidateInit }) => void

  // Hints
  'hint': (hint: HintData) => void
  'hint-denied': (reason: string) => void

  // Reconnection
  'reconnect': (room: Room) => void
  'sync-state': (state: CubeState) => void
}

export interface ClientToServerEvents {
  // Room events
  'create-room': (config: { mode: GameMode; settings?: Partial<RoomSettings> }) => void
  'join-room': (roomId: string) => void
  'leave-room': () => void
  'get-rooms': () => void
  'set-ready': (ready: boolean) => void

  // Game events
  'move': (move: Move) => void
  'coop-move': (move: Move) => void
  'request-hint': () => void

  // Matchmaking
  'find-match': (mode: GameMode) => void
  'cancel-match': () => void

  // Chat
  'chat-message': (message: string) => void

  // WebRTC
  'webrtc-offer': (data: { to: string; offer: RTCSessionDescriptionInit }) => void
  'webrtc-answer': (data: { to: string; answer: RTCSessionDescriptionInit }) => void
  'webrtc-ice-candidate': (data: { to: string; candidate: RTCIceCandidateInit }) => void

  // Reconnection
  'reconnect': (roomId: string) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  playerId: string
  playerName: string
  roomId: string | null
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  playerColor: string
  message: string
  timestamp: number
}

export interface HintData {
  move: string
  layer: string
  direction: 'clockwise' | 'counterclockwise'
  description: string
  highlightCubies: number[] // Indices of cubies to highlight
}

// HTTP API types
export interface CreateRoomRequest {
  mode: GameMode
  settings?: Partial<RoomSettings>
}

export interface CreateRoomResponse {
  roomId: string
}

export interface JoinRoomRequest {
  roomId: string
  playerName: string
}

export interface JoinRoomResponse {
  room: Room
  playerId: string
}

export interface RoomListResponse {
  rooms: Room[]
}

// Solver types
export interface SolveRequest {
  cubeState: CubeState
}

export interface SolveResponse {
  solution: string // Space-separated moves like "R U R' U'"
  moves: Move[]
}

// Statistics
export interface PlayerStats {
  playerId: string
  gamesPlayed: number
  gamesWon: number
  bestTime: number | null
  averageTime: number | null
  averageMoves: number | null
  currentElo: number
  highestElo: number
  winStreak: number
  bestWinStreak: number
}

export interface LeaderboardEntry {
  playerId: string
  playerName: string
  elo: number
  gamesPlayed: number
  winRate: number
  rank: number
}
