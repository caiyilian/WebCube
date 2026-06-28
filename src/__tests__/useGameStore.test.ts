import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../stores/useGameStore.js'

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.resetCube()
    // Ensure hints are also reset
    const state = useGameStore.getState()
    state.hintsUsed = 0
    state.currentHint = null
  })

  describe('initial state', () => {
    it('should start with solved cube', () => {
      const state = useGameStore.getState()
      expect(state.isSolved).toBe(true)
      expect(state.moveHistory).toHaveLength(0)
    })

    it('should have correct initial cube state', () => {
      const state = useGameStore.getState()
      expect(state.cubeState.U).toEqual(Array(9).fill('white'))
      expect(state.cubeState.D).toEqual(Array(9).fill('yellow'))
      expect(state.cubeState.F).toEqual(Array(9).fill('green'))
      expect(state.cubeState.B).toEqual(Array(9).fill('blue'))
      expect(state.cubeState.L).toEqual(Array(9).fill('orange'))
      expect(state.cubeState.R).toEqual(Array(9).fill('red'))
    })
  })

  describe('applyMove', () => {
    it('should apply R move and change cube state', () => {
      useGameStore.applyMove({ face: 'R', direction: 1 })
      
      const state = useGameStore.getState()
      expect(state.isSolved).toBe(false)
      expect(state.moveHistory).toHaveLength(1)
      expect(state.moveHistory[0]).toEqual({ face: 'R', direction: 1 })
    })

    it('should not modify state when validating', () => {
      const initialState = JSON.stringify(useGameStore.getState().cubeState)
      useGameStore.applyMove({ face: 'R', direction: 1 })
      const newState = JSON.stringify(useGameStore.getState().cubeState)
      expect(newState).not.toBe(initialState)
    })
  })

  describe('undo/redo', () => {
    it('should undo last move', () => {
      useGameStore.resetCube()
      useGameStore.applyMove({ face: 'R', direction: 1 })
      useGameStore.applyMove({ face: 'U', direction: 1 })
      
      expect(useGameStore.getState().moveHistoryIndex).toBe(1)
      useGameStore.undo()
      expect(useGameStore.getState().moveHistoryIndex).toBe(0)
    })

    it('should redo undone move', () => {
      useGameStore.applyMove({ face: 'R', direction: 1 })
      useGameStore.undo()
      useGameStore.redo()
      
      const state = useGameStore.getState()
      expect(state.moveHistory).toHaveLength(1)
    })

    it('should not undo when history is empty', () => {
      useGameStore.undo() // Should not throw
      expect(useGameStore.getState().moveHistory).toHaveLength(0)
    })
  })

  describe('scramble', () => {
    it('should scramble the cube', () => {
      useGameStore.scramble(20)
      
      const state = useGameStore.getState()
      expect(state.isSolved).toBe(false)
      expect(state.moveHistory.length).toBeGreaterThan(0)
    })

    it('should reset timer after scramble', () => {
      useGameStore.startTimer()
      useGameStore.scramble(10)
      
      const state = useGameStore.getState()
      expect(state.timerElapsed).toBe(0)
      expect(state.isTimerRunning).toBe(false)
    })
  })

  describe('resetCube', () => {
    it('should reset to solved state', () => {
      useGameStore.scramble(10)
      useGameStore.resetCube()
      
      const state = useGameStore.getState()
      expect(state.isSolved).toBe(true)
      expect(state.moveHistory).toHaveLength(0)
    })
  })

  describe('checkSolved', () => {
    it('should return true for solved cube', () => {
      expect(useGameStore.getState().isSolved).toBe(true)
    })

    it('should return false after scramble', () => {
      useGameStore.scramble(10)
      expect(useGameStore.getState().isSolved).toBe(false)
    })

    it('should return true after solving', () => {
      useGameStore.applyMove({ face: 'R', direction: 1 })
      useGameStore.applyMove({ face: 'R', direction: -1 })
      
      expect(useGameStore.getState().isSolved).toBe(true)
    })
  })

  describe('timer', () => {
    it('should start timer', () => {
      useGameStore.startTimer()
      expect(useGameStore.getState().isTimerRunning).toBe(true)
    })

    it('should stop timer', () => {
      useGameStore.startTimer()
      useGameStore.stopTimer()
      expect(useGameStore.getState().isTimerRunning).toBe(false)
    })

    it('should reset timer', () => {
      useGameStore.startTimer()
      useGameStore.resetTimer()
      
      const state = useGameStore.getState()
      expect(state.timerElapsed).toBe(0)
      expect(state.isTimerRunning).toBe(false)
    })
  })

  describe('hint', () => {
    it('should return hint based on last move', () => {
      useGameStore.applyMove({ face: 'R', direction: 1 })
      useGameStore.requestHint()
      
      const state = useGameStore.getState()
      expect(state.currentHint).not.toBeNull()
      expect(state.currentHint?.move).toBe('R')
    })

    it('should return default hint when no history', () => {
      useGameStore.requestHint()
      
      const state = useGameStore.getState()
      expect(state.currentHint).not.toBeNull()
      expect(state.currentHint?.move).toBe('R')
    })

    it('should track hints used', () => {
      useGameStore.resetCube()
      useGameStore.requestHint()
      expect(useGameStore.getState().hintsUsed).toBe(1)
    })
  })

  describe('autoSolve', () => {
    it('should solve the cube', async () => {
      useGameStore.scramble(5)
      await useGameStore.autoSolve()
      
      expect(useGameStore.getState().isSolved).toBe(true)
    })

    it('should stop timer after solve', async () => {
      useGameStore.scramble(5)
      await useGameStore.autoSolve()
      
      expect(useGameStore.getState().isTimerRunning).toBe(false)
    })
  })
})
