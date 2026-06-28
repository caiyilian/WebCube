// @ts-nocheck
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { RoomManager } from './rooms/RoomManager.js'
import { Matchmaking } from './rooms/Matchmaking.js'
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, GameMode, RoomSettings } from '@shared/types.js'

const app = express()
const httpServer = createServer(app)
app.use(express.json())

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Room manager
const roomManager = new RoomManager(io)
const matchmaking = new Matchmaking(io, roomManager)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// API routes
app.get('/api/rooms', (_req, res) => {
  const rooms = roomManager.getPublicRooms()
  res.json({ rooms })
})

app.post('/api/rooms', express.json(), (req, res) => {
  const { mode, settings } = req.body
  const roomId = roomManager.createRoom({ mode, host: '', settings })
  res.json({ roomId })
})

app.get('/api/leaderboard', (_req, res) => {
  const leaderboard = roomManager.getLeaderboard()
  res.json({ leaderboard })
})

app.get('/api/stats/:playerId', (req, res) => {
  const stats = roomManager.getPlayerStats(req.params.playerId)
  res.json(stats)
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Generate player ID and name
  const playerId = socket.id
  const playerName = `Player_${playerId.slice(0, 4)}`
  socket.data.playerId = playerId
  socket.data.playerName = playerName
  socket.data.roomId = null

  // Room events
  socket.on('create-room', (config) => {
    const roomId = roomManager.createRoom({
      mode: config.mode,
      host: playerId,
      settings: config.settings,
    })
    const room = roomManager.joinRoom(roomId, {
      id: playerId,
      name: playerName,
      color: getRandomColor(),
      isHost: true,
      isReady: false,
      moveCount: 0,
      solveTime: null,
      hintsUsed: 0,
    })
    socket.data.roomId = roomId
    socket.join(roomId)
    socket.emit('room-created', roomId)
    if (room) socket.emit('room-joined', room)
    console.log(`Room created: ${roomId} by ${playerName} (${config.mode})`)
  })

  socket.on('join-room', (roomId) => {
    const isSpectator = roomManager.isRoomFull(roomId)
    const room = roomManager.joinRoom(roomId, {
      id: playerId,
      name: playerName,
      color: getRandomColor(),
      isHost: false,
      isReady: false,
      moveCount: 0,
      solveTime: null,
      hintsUsed: 0,
    })

    if (!room) {
      socket.emit('room-error', '房间不存在或已满')
      return
    }

    socket.data.roomId = roomId
    socket.join(roomId)
    socket.emit('room-joined', room)

    if (isSpectator) {
      socket.to(roomId).emit('spectator-joined', { id: playerId, name: playerName })
      console.log(`${playerName} joined room ${roomId} as spectator`)
    } else {
      socket.to(roomId).emit('player-joined', room.players.find(p => p.id === playerId)!)
      console.log(`${playerName} joined room ${roomId}`)
    }
  })

  socket.on('leave-room', () => {
    const roomId = socket.data.roomId
    if (roomId) {
      roomManager.leaveRoom(roomId, playerId)
      socket.leave(roomId)
      socket.to(roomId).emit('player-left', playerId)
      socket.data.roomId = null
      console.log(`${playerName} left room ${roomId}`)
    }
  })

  socket.on('get-rooms', () => {
    socket.emit('room-list', roomManager.getPublicRooms())
  })

  socket.on('set-ready', (ready: boolean) => {
    const roomId = socket.data.roomId
    if (roomId) {
      roomManager.setPlayerReady(roomId, playerId, ready)
      io.to(roomId).emit('player-ready', playerId)
    }
  })

  socket.on('start-game', () => {
    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('room-error', '请先进入房间')
      return
    }

    const result = roomManager.startRoom(roomId, playerId)
    if (!result.ok) {
      socket.emit('room-error', result.error || '无法开始游戏')
    }
  })

  // Game events
  socket.on('move', (move: Move) => {
    const roomId = socket.data.roomId
    if (roomId) {
      // Validate move
      if (roomManager.validateMove(roomId, move)) {
        socket.to(roomId).emit('opponent-move', move)
        roomManager.applyMove(roomId, playerId, move)
      }
    }
  })

  socket.on('set-turn-mode', (enabled: boolean) => {
    const roomId = socket.data.roomId
    if (roomId) {
      roomManager.setTurnMode(roomId, enabled)
      io.to(roomId).emit('turn-mode-changed', enabled)
    }
  })

  socket.on('set-free-mode', (enabled: boolean) => {
    const roomId = socket.data.roomId
    if (roomId) {
      // Free mode is turn mode off
      roomManager.setTurnMode(roomId, !enabled)
      io.to(roomId).emit('free-mode-changed', enabled)
    }
  })

  socket.on('coop-move', (move: Move) => {
    const roomId = socket.data.roomId
    if (roomId) {
      // Check turn mode
      const room = roomManager.getRoom(roomId)
      if (room?.turnMode && room.currentTurn !== playerId) {
        socket.emit('turn-error', 'Not your turn')
        return
      }
      if (roomManager.validateMove(roomId, move)) {
        const cubeState = roomManager.applyMove(roomId, playerId, move)
        if (cubeState) {
          io.to(roomId).emit('cube-update', cubeState)
        }
        if (room?.turnMode) {
          roomManager.nextTurn(roomId)
          io.to(roomId).emit('turn-changed', room.currentTurn)
        }
      }
    }
  })

  // Matchmaking
  socket.on('find-match', (mode: GameMode) => {
    matchmaking.findMatch(playerId, playerName, mode)
  })

  socket.on('cancel-match', () => {
    matchmaking.cancelMatch(playerId)
  })

  // Chat
  socket.on('chat-message', (message: string) => {
    const roomId = socket.data.roomId
    if (roomId) {
      const chatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        playerId,
        playerName,
        playerColor: getPlayerColor(roomId, playerId),
        message,
        timestamp: Date.now(),
      }
      roomManager.addChatMessage(roomId, chatMessage)
      io.to(roomId).emit('chat-message', chatMessage)
    }
  })

  // WebRTC signaling
  socket.on('webrtc-offer', (data: { to: string; offer: RTCSessionDescriptionInit }) => {
    socket.to(data.to).emit('webrtc-offer', { from: playerId, offer: data.offer })
  })

  socket.on('webrtc-answer', (data: { to: string; answer: RTCSessionDescriptionInit }) => {
    socket.to(data.to).emit('webrtc-answer', { from: playerId, answer: data.answer })
  })

  socket.on('webrtc-ice-candidate', (data: { to: string; candidate: RTCIceCandidateInit }) => {
    socket.to(data.to).emit('webrtc-ice-candidate', { from: playerId, candidate: data.candidate })
  })

  // Hints
  socket.on('request-hint', () => {
    const roomId = socket.data.roomId
    if (roomId) {
      const hint = roomManager.getHint(roomId, playerId)
      if (hint) {
        socket.emit('hint', hint)
      } else {
        socket.emit('hint-denied', 'Hint only available in practice mode or hints exhausted')
      }
    }
  })

  // Reconnection
  socket.on('reconnect', (roomId: string) => {
    const room = roomManager.reconnect(roomId, playerId)
    if (room) {
      socket.data.roomId = roomId
      socket.join(roomId)
      socket.emit('reconnect', room)
    }
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${playerName} (${playerId})`)
    const roomId = socket.data.roomId
    if (roomId) {
      roomManager.handleDisconnect(roomId, playerId)
      socket.to(roomId).emit('player-left', playerId)
    }
    matchmaking.cancelMatch(playerId)
  })
})

function getRandomColor(): string {
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea']
  return colors[Math.floor(Math.random() * colors.length)]
}

function getPlayerColor(roomId: string, playerId: string): string {
  const room = roomManager.getRoom(roomId)
  if (room) {
    const player = room.players.find(p => p.id === playerId)
    return player?.color || '#ffffff'
  }
  return '#ffffff'
}

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`WebSocket server ready`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
