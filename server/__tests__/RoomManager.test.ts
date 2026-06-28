import { describe, it, expect, beforeEach } from 'vitest'
import { RoomManager } from '../rooms/RoomManager.js'

describe('RoomManager', () => {
  let roomManager: RoomManager
  let emitted: Array<{ roomId: string; event: string; payload: unknown }>

  beforeEach(() => {
    emitted = []
    // Create a mock io object
    const mockIo = {
      to: (roomId: string) => ({
        emit: (event: string, payload: unknown) => {
          emitted.push({ roomId, event, payload })
        },
      }),
    }
    roomManager = new RoomManager(mockIo as any)
  })

  describe('createRoom', () => {
    it('should create a room with 6-char ID', () => {
      const roomId = roomManager.createRoom({
        mode: '1v1',
        host: 'player1',
        settings: {},
      })
      expect(roomId).toHaveLength(6)
    })

    it('should set maxPlayers correctly for 1v1 mode', () => {
      const roomId = roomManager.createRoom({
        mode: '1v1',
        host: 'player1',
        settings: {},
      })
      const room = roomManager.getRoom(roomId)
      expect(room?.maxPlayers).toBe(2)
    })

    it('should set maxPlayers correctly for coop mode', () => {
      const roomId = roomManager.createRoom({
        mode: 'coop',
        host: 'player1',
        settings: {},
      })
      const room = roomManager.getRoom(roomId)
      expect(room?.maxPlayers).toBe(4)
    })
  })

  describe('joinRoom', () => {
    it('should join a room successfully', () => {
      const roomId = roomManager.createRoom({
        mode: '1v1',
        host: '',
        settings: {},
      })
      const room = roomManager.joinRoom(roomId, {
        id: 'player1',
        name: 'Player 1',
        color: '#ff0000',
        isHost: false,
        isReady: false,
        moveCount: 0,
        solveTime: null,
        hintsUsed: 0,
      })
      expect(room).not.toBeNull()
      expect(room?.players).toHaveLength(1)
    })

    it('should return null for non-existent room', () => {
      const room = roomManager.joinRoom('xxxxxx', {
        id: 'player1',
        name: 'Player 1',
        color: '#ff0000',
        isHost: false,
        isReady: false,
        moveCount: 0,
        solveTime: null,
        hintsUsed: 0,
      })
      expect(room).toBeNull()
    })
  })

  describe('getRoom', () => {
    it('should return room by ID', () => {
      const roomId = roomManager.createRoom({
        mode: 'practice',
        host: '',
        settings: {},
      })
      const room = roomManager.getRoom(roomId)
      expect(room).not.toBeNull()
      expect(room?.id).toBe(roomId)
    })

    it('should return undefined for non-existent room', () => {
      const room = roomManager.getRoom('xxxxxx')
      expect(room).toBeUndefined()
    })
  })

  describe('getPublicRooms', () => {
    it('should return waiting rooms', () => {
      roomManager.createRoom({
        mode: '1v1',
        host: '',
        settings: {},
      })
      const rooms = roomManager.getPublicRooms()
      expect(rooms.length).toBeGreaterThan(0)
    })
  })

  describe('coop shared state', () => {
    it('starts coop rooms with a shared cube state in game-start payload', () => {
      const roomId = roomManager.createRoom({
        mode: 'coop',
        host: 'player1',
        settings: { cubeSize: 3 },
      })
      roomManager.joinRoom(roomId, {
        id: 'player1',
        name: 'Player 1',
        color: '#ff0000',
        isHost: true,
        isReady: false,
        moveCount: 0,
        solveTime: null,
        hintsUsed: 0,
      })
      roomManager.joinRoom(roomId, {
        id: 'player2',
        name: 'Player 2',
        color: '#00ff00',
        isHost: false,
        isReady: false,
        moveCount: 0,
        solveTime: null,
        hintsUsed: 0,
      })

      const result = roomManager.startRoom(roomId, 'player1')
      const room = roomManager.getRoom(roomId)
      const gameStart = emitted.find((item) => item.event === 'game-start')

      expect(result.ok).toBe(true)
      expect(room?.sharedCubeState).toBeTruthy()
      expect(gameStart?.payload).toMatchObject({
        mode: 'coop',
        cubeState: room?.sharedCubeState,
      })
    })
  })

  describe('coop turn mode', () => {
    it('allows only the host to switch turn mode', () => {
      const roomId = roomManager.createRoom({
        mode: 'coop',
        host: 'player1',
        settings: {},
      })
      roomManager.joinRoom(roomId, {
        id: 'player1',
        name: 'Player 1',
        color: '#ff0000',
        isHost: true,
        isReady: false,
        moveCount: 0,
        solveTime: null,
        hintsUsed: 0,
      })
      roomManager.joinRoom(roomId, {
        id: 'player2',
        name: 'Player 2',
        color: '#00ff00',
        isHost: false,
        isReady: false,
        moveCount: 0,
        solveTime: null,
        hintsUsed: 0,
      })

      expect(roomManager.setTurnModeForPlayer(roomId, 'player2', true)).toMatchObject({ ok: false })
      expect(roomManager.setTurnModeForPlayer(roomId, 'player1', true)).toMatchObject({
        ok: true,
        currentTurn: 'player1',
      })
      expect(roomManager.getRoom(roomId)?.turnMode).toBe(true)
      expect(roomManager.setTurnModeForPlayer(roomId, 'player1', false)).toMatchObject({
        ok: true,
        currentTurn: null,
      })
    })
  })

  describe('hints', () => {
    it('rejects hints outside practice mode', () => {
      const roomId = roomManager.createRoom({
        mode: 'coop',
        host: 'player1',
        settings: {},
      })
      roomManager.joinRoom(roomId, {
        id: 'player1',
        name: 'Player 1',
        color: '#ff0000',
        isHost: true,
        isReady: false,
        moveCount: 0,
        solveTime: null,
        hintsUsed: 0,
      })

      expect(roomManager.getHint(roomId, 'player1')).toBeNull()
    })
  })
})
