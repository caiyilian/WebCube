// @ts-nocheck
import { Server } from 'socket.io'
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, GameMode, Player } from '@shared/types.js'
import { RoomManager } from './RoomManager.js'

interface QueuedPlayer {
  playerId: string
  playerName: string
  mode: GameMode
  socket: any
  queuedAt: number
}

export class Matchmaking {
  private queue = new Map<GameMode, QueuedPlayer[]>()
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  private roomManager: RoomManager

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    roomManager: RoomManager
  ) {
    this.io = io
    this.roomManager = roomManager
  }

  findMatch(playerId: string, playerName: string, mode: GameMode): void {
    // Check if already in queue
    const existingQueue = this.queue.get(mode) || []
    if (existingQueue.some(p => p.playerId === playerId)) {
      return
    }

    const queuedPlayer: QueuedPlayer = {
      playerId,
      playerName,
      mode,
      socket: this.io.sockets.sockets.get(playerId),
      queuedAt: Date.now(),
    }

    const queue = this.queue.get(mode) || []
    queue.push(queuedPlayer)
    this.queue.set(mode, queue)

    // Try to match
    this.tryMatch(mode)
  }

  cancelMatch(playerId: string): void {
    for (const [mode, queue] of this.queue.entries()) {
      const index = queue.findIndex(p => p.playerId === playerId)
      if (index !== -1) {
        queue.splice(index, 1)
        this.io.to(playerId).emit('match-cancelled')
        break
      }
    }
  }

  removeFromQueue(playerId: string): void {
    for (const [mode, queue] of this.queue.entries()) {
      const index = queue.findIndex(p => p.playerId === playerId)
      if (index !== -1) {
        queue.splice(index, 1)
        break
      }
    }
  }

  private tryMatch(mode: GameMode): void {
    const queue = this.queue.get(mode) || []
    if (queue.length < 2) return

    // Take first two players
    const [player1, player2] = queue.splice(0, 2)
    this.queue.set(mode, queue)

    // Create room
    const roomId = this.roomManager.createRoom({
      mode,
      host: player1.playerId,
      settings: {},
    })

    // Add both players to room
    this.roomManager.joinRoom(roomId, {
      id: player1.playerId,
      name: player1.playerName,
      color: '#4da6ff',
      isHost: true,
      isReady: true,
      moveCount: 0,
      solveTime: null,
      hintsUsed: 0,
    })

    this.roomManager.joinRoom(roomId, {
      id: player2.playerId,
      name: player2.playerName,
      color: '#ff6b6b',
      isHost: false,
      isReady: true,
      moveCount: 0,
      solveTime: null,
      hintsUsed: 0,
    })

    // Notify both players
    this.io.to(player1.playerId).emit('match-found', roomId)
    this.io.to(player2.playerId).emit('match-found', roomId)

    // Join sockets to room
    const socket1 = this.io.sockets.sockets.get(player1.playerId)
    const socket2 = this.io.sockets.sockets.get(player2.playerId)
    if (socket1) socket1.join(roomId)
    if (socket2) socket2.join(roomId)

    // Start game immediately
    this.roomManager.startGame(roomId)
  }
}