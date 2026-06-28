import { describe, it, expect, beforeEach } from 'vitest'
import { RoomManager } from '../rooms/RoomManager.js'

describe('RoomManager', () => {
  let roomManager: RoomManager

  beforeEach(() => {
    // Create a mock io object
    const mockIo = {
      to: () => ({ emit: () => {} }),
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
})
