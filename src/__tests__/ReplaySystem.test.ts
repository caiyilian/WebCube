import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReplayRecorder, ReplayPlayer } from '../game/ReplaySystem.js'

describe('ReplaySystem', () => {
  describe('ReplayRecorder', () => {
    let recorder: ReplayRecorder

    beforeEach(() => {
      recorder = new ReplayRecorder()
    })

    it('should start recording', () => {
      recorder.startRecording()
      // No error means success
      expect(true).toBe(true)
    })

    it('should record moves', () => {
      recorder.startRecording()
      recorder.recordMove({ face: 'R', direction: 1 })
      recorder.recordMove({ face: 'U', direction: -1 })

      const data = recorder.getReplayData()
      expect(data.frames).toHaveLength(2)
      expect(data.moveCount).toBe(2)
    })

    it('should not record when not started', () => {
      recorder.recordMove({ face: 'R', direction: 1 })

      const data = recorder.getReplayData()
      expect(data.frames).toHaveLength(0)
    })

    it('should clear frames', () => {
      recorder.startRecording()
      recorder.recordMove({ face: 'R', direction: 1 })
      recorder.clear()

      const data = recorder.getReplayData()
      expect(data.frames).toHaveLength(0)
    })
  })

  describe('ReplayPlayer', () => {
    let player: ReplayPlayer
    let frameCallback: ReturnType<typeof vi.fn>
    let completeCallback: ReturnType<typeof vi.fn>

    beforeEach(() => {
      player = new ReplayPlayer()
      frameCallback = vi.fn()
      completeCallback = vi.fn()
    })

    it('should load replay data', () => {
      const data = {
        frames: [
          { move: { face: 'R' as const, direction: 1 as const }, timestamp: 0 },
          { move: { face: 'U' as const, direction: -1 as const }, timestamp: 100 },
        ],
        duration: 100,
        moveCount: 2,
      }

      player.loadReplay(data)
      expect(player.getCurrentIndex()).toBe(0)
      expect(player.getTotalFrames()).toBe(2)
    })

    it('should set callbacks', () => {
      const data = {
        frames: [{ move: { face: 'R' as const, direction: 1 as const }, timestamp: 0 }],
        duration: 0,
        moveCount: 1,
      }

      player.loadReplay(data)
      player.setCallbacks(frameCallback, completeCallback)
      expect(true).toBe(true)
    })

    it('should reset to beginning', () => {
      const data = {
        frames: [
          { move: { face: 'R' as const, direction: 1 as const }, timestamp: 0 },
          { move: { face: 'U' as const, direction: -1 as const }, timestamp: 100 },
        ],
        duration: 100,
        moveCount: 2,
      }

      player.loadReplay(data)
      player.reset()
      expect(player.getCurrentIndex()).toBe(0)
    })
  })
})
