import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Matchmaking } from '../rooms/Matchmaking.js'

function createMockIo() {
  const sockets = new Map<string, any>()
  return {
    sockets: { sockets },
    to: vi.fn(() => ({ emit: vi.fn() })),
  } as any
}

function createMockRoomManager() {
  let roomIdCounter = 0
  return {
    createRoom: vi.fn(() => `room-${++roomIdCounter}`),
    joinRoom: vi.fn(),
    getRoom: vi.fn(() => ({ id: 'room-1', players: [], mode: '1v1' })),
    startGame: vi.fn(),
  } as any
}

describe('Matchmaking', () => {
  let matchmaking: Matchmaking
  let mockIo: ReturnType<typeof createMockIo>
  let mockRoomManager: ReturnType<typeof createMockRoomManager>

  beforeEach(() => {
    mockIo = createMockIo()
    mockRoomManager = createMockRoomManager()
    matchmaking = new Matchmaking(mockIo, mockRoomManager)
  })

  describe('findMatch', () => {
    it('adds a player to the queue', () => {
      matchmaking.findMatch('p1', 'Player 1', '1v1')
      // After adding one player, tryMatch should not fire (need 2)
      expect(mockRoomManager.createRoom).not.toHaveBeenCalled()
    })

    it('does not add duplicate player to queue', () => {
      matchmaking.findMatch('p1', 'Player 1', '1v1')
      matchmaking.findMatch('p1', 'Player 1', '1v1')
      // Only one entry, so room should not be created
      expect(mockRoomManager.createRoom).not.toHaveBeenCalled()
    })

    it('matches two players in the same mode', () => {
      matchmaking.findMatch('p1', 'Player 1', '1v1')
      matchmaking.findMatch('p2', 'Player 2', '1v1')
      // Two players in queue should trigger match
      expect(mockRoomManager.createRoom).toHaveBeenCalledTimes(1)
      expect(mockRoomManager.joinRoom).toHaveBeenCalledTimes(2)
      expect(mockRoomManager.startGame).toHaveBeenCalledTimes(1)
    })

    it('does not match players in different modes', () => {
      matchmaking.findMatch('p1', 'Player 1', '1v1')
      matchmaking.findMatch('p2', 'Player 2', 'coop')
      // Different modes, should not match
      expect(mockRoomManager.createRoom).not.toHaveBeenCalled()
    })

    it('matches players in correct mode queue', () => {
      matchmaking.findMatch('p1', 'Player 1', 'coop')
      matchmaking.findMatch('p2', 'Player 2', '1v1')
      matchmaking.findMatch('p3', 'Player 3', 'coop')
      // p1 and p3 are in coop mode, should match
      expect(mockRoomManager.createRoom).toHaveBeenCalledTimes(1)
    })

    it('matches three players into one pair and leaves one', () => {
      matchmaking.findMatch('p1', 'Player 1', '1v1')
      matchmaking.findMatch('p2', 'Player 2', '1v1')
      matchmaking.findMatch('p3', 'Player 3', '1v1')
      // First two matched, third stays in queue
      expect(mockRoomManager.createRoom).toHaveBeenCalledTimes(1)
      expect(mockRoomManager.joinRoom).toHaveBeenCalledTimes(2)
    })
  })

  describe('cancelMatch', () => {
    it('removes player from queue', () => {
      matchmaking.findMatch('p1', 'Player 1', '1v1')
      matchmaking.cancelMatch('p1')
      // After cancel, adding p2 should not create room
      matchmaking.findMatch('p2', 'Player 2', '1v1')
      expect(mockRoomManager.createRoom).not.toHaveBeenCalled()
    })

    it('emits match-cancelled event', () => {
      matchmaking.findMatch('p1', 'Player 1', '1v1')
      matchmaking.cancelMatch('p1')
      expect(mockIo.to).toHaveBeenCalledWith('p1')
    })
  })
})
