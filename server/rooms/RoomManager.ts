// @ts-nocheck
import { Server } from 'socket.io'
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, Room, Player, GameMode, RoomSettings, Move, CubeState, GameResult, HintData } from '@shared/types.js'

const DEFAULT_SETTINGS: RoomSettings = {
  hintEnabled: false,
  maxHints: 3,
  timeLimit: null,
  chatEnabled: true,
}

const MODE_CONFIG: Record<GameMode, { maxPlayers: number; hintEnabled: boolean }> = {
  practice: { maxPlayers: 1, hintEnabled: true },
  '1v1': { maxPlayers: 2, hintEnabled: false },
  coop: { maxPlayers: 4, hintEnabled: false },
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

function generatePlayerColor(index: number): string {
  const colors = ['#4da6ff', '#ff6b6b', '#6bff6b', '#ffd93d', '#ff6bff', '#6bffff']
  return colors[index % colors.length]
}

export class RoomManager {
  private rooms = new Map<string, Room>()
  private playerStats = new Map<string, { elo: number; gamesPlayed: number; gamesWon: number }>()
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    this.io = io
  }

  createRoom(config: { mode: GameMode; host: string; settings?: Partial<RoomSettings> }): string {
    const roomId = generateRoomId()
    const configMode = MODE_CONFIG[config.mode]
    
    const room: Room = {
      id: roomId,
      mode: config.mode,
      host: config.host,
      players: [],
      spectators: [],
      maxPlayers: configMode.maxPlayers,
      scramble: null,
      status: 'waiting',
      createdAt: Date.now(),
      settings: {
        ...DEFAULT_SETTINGS,
        hintEnabled: configMode.hintEnabled,
        ...config.settings,
      },
    }

    this.rooms.set(roomId, room)
    return roomId
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  isRoomFull(roomId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false
    return room.players.length >= room.maxPlayers
  }

  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) => room.status === 'waiting' && room.players.length < room.maxPlayers
    )
  }

  joinRoom(roomId: string, player: Player): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null
    if (room.status !== 'waiting' && room.status !== 'playing') return null

    // If room is full, add as spectator
    if (room.players.length >= room.maxPlayers) {
      if (room.spectators.length >= 6) return null // Max 6 spectators
      room.spectators.push(player)
      return room
    }

    // Set host if first player
    if (room.players.length === 0) {
      room.host = player.id
      player.isHost = true
    }

    player.color = generatePlayerColor(room.players.length)
    room.players.push(player)
    return room
  }

  leaveRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    const playerIndex = room.players.findIndex((p) => p.id === playerId)
    if (playerIndex === -1) return false

    const wasHost = room.players[playerIndex].isHost
    room.players.splice(playerIndex, 1)

    // Assign new host if needed
    if (wasHost && room.players.length > 0) {
      room.players[0].isHost = true
      room.host = room.players[0].id
    }

    // Clean up empty rooms after a delay
    if (room.players.length === 0 && room.spectators.length === 0) {
      setTimeout(() => {
        const currentRoom = this.rooms.get(roomId)
        if (currentRoom && currentRoom.players.length === 0 && currentRoom.spectators.length === 0) {
          this.rooms.delete(roomId)
        }
      }, 30000) // 30 seconds grace period for reconnection
    }

    return true
  }

  setPlayerReady(roomId: string, playerId: string, ready: boolean): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    const player = room.players.find((p) => p.id === playerId)
    if (!player) return false

    player.isReady = ready

    // Check if all players ready and start game
    if (room.players.length === room.maxPlayers && room.players.every((p) => p.isReady)) {
      this.startGame(roomId)
    }

    return true
  }

  private startGame(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.status = 'playing'
    room.scramble = this.generateScramble(25)

    // Reset player states
    room.players.forEach((player) => {
      player.moveCount = 0
      player.solveTime = null
      player.hintsUsed = 0
      player.cubeState = this.applyScramble(room.scramble!)
    })

    this.io.to(roomId).emit('game-start', {
      scramble: room.scramble,
      mode: room.mode,
      players: room.players,
    })
  }

  validateMove(roomId: string, move: Move): boolean {
    const room = this.rooms.get(roomId)
    if (!room || room.status !== 'playing') return false

    const validFaces = ['R', 'L', 'U', 'D', 'F', 'B']
    return validFaces.includes(move.face) && (move.direction === 1 || move.direction === -1)
  }

  applyMove(roomId: string, playerId: string, move: Move): CubeState | null {
    const room = this.rooms.get(roomId)
    if (!room || room.status !== 'playing') return null

    const player = room.players.find((p) => p.id === playerId)
    if (!player || !player.cubeState) return null

    player.cubeState = this.applyMoveToState(player.cubeState, move)
    player.moveCount++

    // Check if solved
    if (this.isSolved(player.cubeState)) {
      player.solveTime = Date.now()
      this.checkGameEnd(roomId)
    }

    return player.cubeState
  }

  private checkGameEnd(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (!room || room.status !== 'playing') return

    const solvedPlayers = room.players.filter((p) => p.solveTime !== null)
    if (solvedPlayers.length > 0) {
      // Game ended
      room.status = 'finished'
      
      // Determine winner
      let winner: string | null = null
      if (room.mode === '1v1') {
        winner = solvedPlayers[0].id
      } else if (room.mode === 'coop') {
        // In coop, team wins together
        winner = 'team'
      }

      // Calculate ELO changes
      const winnerId = winner
      const results = room.players.map((player) => {
        const isWinner = player.id === winnerId
        const eloChange = this.calculateELO(player.id, winnerId, isWinner)
        return {
          id: player.id,
          name: player.name,
          moveCount: player.moveCount,
          solveTime: player.solveTime,
          eloChange,
        }
      })

      const gameResult: GameResult = {
        winner,
        players: results,
        scramble: room.scramble!,
        duration: solvedPlayers[0].solveTime! - room.createdAt,
      }

      this.io.to(roomId).emit('game-end', gameResult)
    }
  }

  getHint(roomId: string, playerId: string): HintData | null {
    const room = this.rooms.get(roomId)
    if (!room || room.mode !== 'practice') return null

    const player = room.players.find(p => p.id === playerId)
    if (!player || player.hintsUsed >= room.settings.maxHints) return null

    // In practice mode, hint is generated client-side
    // Server just tracks usage
    player.hintsUsed++

    return {
      move: 'R',
      layer: 'R',
      direction: 'clockwise',
      description: 'Right face clockwise',
      highlightCubies: [],
    }
  }

  reconnect(roomId: string, playerId: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const player = room.players.find(p => p.id === playerId)
    if (!player) return null

    return room
  }

  handleDisconnect(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    // Mark player as disconnected but keep in room for 30s reconnection window
    const player = room.players.find(p => p.id === playerId)
    if (player) {
      // Could add a disconnected flag here
    }

    // Clean up after 30 seconds if not reconnected
    setTimeout(() => {
      const currentRoom = this.rooms.get(roomId)
      if (currentRoom) {
        const stillThere = currentRoom.players.find(p => p.id === playerId)
        if (stillThere) {
          this.leaveRoom(roomId, playerId)
          this.io.to(roomId).emit('player-left', playerId)
        }
      }
    }, 30000)
  }

  private generateScramble(moves: number): string {
    const faces: Array<'R' | 'L' | 'U' | 'D' | 'F' | 'B'> = ['R', 'L', 'U', 'D', 'F', 'B']
    const scramble: string[] = []
    let lastFace = ''
    let lastLastFace = ''

    for (let i = 0; i < moves; i++) {
      let face: typeof faces[0]
      do {
        face = faces[Math.floor(Math.random() * faces.length)]
      } while (face === lastFace || face === lastLastFace)

      const direction = Math.random() < 0.5 ? '' : "'"
      scramble.push(`${face}${direction}`)
      lastLastFace = lastFace
      lastFace = face
    }

    return scramble.join(' ')
  }

  private applyScramble(scramble: string): CubeState {
    // Simplified - return solved state for now
    // Full implementation would parse scramble and apply moves
    return {
      U: Array(9).fill('white'),
      D: Array(9).fill('yellow'),
      F: Array(9).fill('green'),
      B: Array(9).fill('blue'),
      L: Array(9).fill('orange'),
      R: Array(9).fill('red'),
    }
  }

  private applyMoveToState(state: CubeState, move: Move): CubeState {
    // Simplified - return same state for now
    // Full implementation would apply the move
    return state
  }

  private isSolved(state: CubeState): boolean {
    const colors = {
      U: 'white',
      D: 'yellow',
      F: 'green',
      B: 'blue',
      L: 'orange',
      R: 'red',
    }
    for (const [face, color] of Object.entries(colors)) {
      if (!state[face as keyof CubeState].every((c) => c === color)) {
        return false
      }
    }
    return true
  }

  private calculateELO(playerId: string, winnerId: string, isWinner: boolean): number {
    const K = 32 // ELO K-factor
    const playerStats = this.playerStats.get(playerId) || { elo: 1200, gamesPlayed: 0, gamesWon: 0 }
    const opponentStats = this.playerStats.get(winnerId) || { elo: 1200, gamesPlayed: 0, gamesWon: 0 }

    const expectedScore = 1 / (1 + Math.pow(10, (opponentStats.elo - playerStats.elo) / 400))
    const actualScore = isWinner ? 1 : 0

    return Math.round(K * (actualScore - expectedScore))
  }

  getPlayerStats(playerId: string): { elo: number; gamesPlayed: number; gamesWon: number } {
    return this.playerStats.get(playerId) || { elo: 1200, gamesPlayed: 0, gamesWon: 0 }
  }

  getLeaderboard(): Array<{ id: string; elo: number; gamesPlayed: number; gamesWon: number }> {
    return Array.from(this.playerStats.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 100)
  }
}