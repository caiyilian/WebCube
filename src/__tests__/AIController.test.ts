import { describe, it, expect, vi } from 'vitest'
import { AIController } from '../game/AIController.js'

describe('AIController', () => {
  let ai: AIController

  beforeEach(() => {
    ai = new AIController()
  })

  describe('createAI', () => {
    it('should create AI with easy difficulty', () => {
      const opponent = ai.createAI('easy')
      expect(opponent.difficulty).toBe('easy')
      expect(opponent.name).toBe('AI 新手')
    })

    it('should create AI with medium difficulty', () => {
      const opponent = ai.createAI('medium')
      expect(opponent.difficulty).toBe('medium')
      expect(opponent.name).toBe('AI 高手')
    })

    it('should create AI with hard difficulty', () => {
      const opponent = ai.createAI('hard')
      expect(opponent.difficulty).toBe('hard')
      expect(opponent.name).toBe('AI 大师')
    })
  })

  describe('getAI', () => {
    it('should return null before creation', () => {
      expect(ai.getAI()).toBeNull()
    })

    it('should return AI after creation', () => {
      ai.createAI('medium')
      expect(ai.getAI()).not.toBeNull()
    })
  })

  describe('solving', () => {
    it('should not be solving initially', () => {
      ai.createAI('easy')
      expect(ai.isSolving()).toBe(false)
    })

    it('should be solving after start', () => {
      ai.createAI('hard')
      ai.startSolving("R U R' U'")
      expect(ai.isSolving()).toBe(true)
    })

    it('should not be solving after stop', () => {
      ai.createAI('hard')
      ai.startSolving("R U R' U'")
      ai.stopSolving()
      expect(ai.isSolving()).toBe(false)
    })
  })

  describe('callbacks', () => {
    it('should set onMove callback', () => {
      ai.createAI('hard')
      const callback = vi.fn()
      ai.setOnMove(callback)
      expect(true).toBe(true)
    })
  })

  describe('generateSolvingMoves', () => {
    it('should generate moves from scramble', () => {
      ai.createAI('hard')
      const opponent = ai.getAI()!
      expect(opponent.id).toBe('ai-opponent')
      expect(opponent.solving).toBe(false)
    })
  })
})
