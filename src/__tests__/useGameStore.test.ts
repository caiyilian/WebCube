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

    it.each([2, 3, 4] as const)('should undo a face move with its inverse for %ix%i', (size) => {
      useGameStore.setCubeSize(size)
      const initialState = JSON.stringify(useGameStore.getState().cubeState)

      useGameStore.applyMove({ face: 'R', direction: 1 })
      useGameStore.applyMove({ face: 'R', direction: -1 })

      expect(JSON.stringify(useGameStore.getState().cubeState)).toBe(initialState)
      expect(useGameStore.getState().isSolved).toBe(true)
    })

    it.each([2, 3, 4] as const)('should return to solved after four same-face turns for %ix%i', (size) => {
      useGameStore.setCubeSize(size)
      const initialState = JSON.stringify(useGameStore.getState().cubeState)

      for (let i = 0; i < 4; i++) useGameStore.applyMove({ face: 'F', direction: 1 })

      expect(JSON.stringify(useGameStore.getState().cubeState)).toBe(initialState)
      expect(useGameStore.getState().isSolved).toBe(true)
    })

    it('should update adjacent strips for 4x4 face turns', () => {
      useGameStore.setCubeSize(4)

      useGameStore.applyMove({ face: 'R', direction: 1 })

      expect(useGameStore.getState().cubeState.U).not.toEqual(Array(16).fill('white'))
      expect(useGameStore.getState().isSolved).toBe(false)
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

    it('should expose visible move count through the history cursor', () => {
      useGameStore.applyMove({ face: 'R', direction: 1 })
      useGameStore.applyMove({ face: 'U', direction: 1 })

      expect(useGameStore.getState().moveHistoryIndex + 1).toBe(2)
      useGameStore.undo()
      expect(useGameStore.getState().moveHistoryIndex + 1).toBe(1)
      useGameStore.redo()
      expect(useGameStore.getState().moveHistoryIndex + 1).toBe(2)
    })

    it('should redo undone move', () => {
      useGameStore.applyMove({ face: 'R', direction: 1 })
      useGameStore.undo()
      useGameStore.redo()
      
      const state = useGameStore.getState()
      expect(state.moveHistory).toHaveLength(1)
      expect(state.moveHistoryIndex).toBe(0)
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
    it('should return hint based on the next solver move', async () => {
      useGameStore.applyMove({ face: 'R', direction: 1 })
      await useGameStore.requestHint()
      
      const state = useGameStore.getState()
      expect(state.currentHint).not.toBeNull()
      expect(state.currentHint?.move).toBe('R')
      expect(state.currentHint?.direction).toBe('counterclockwise')
    })

    it('should not invent a hint when no solver move is needed', async () => {
      await useGameStore.requestHint()
      
      const state = useGameStore.getState()
      expect(state.currentHint).toBeNull()
    })

    it('should track hints used', async () => {
      useGameStore.resetCube()
      await useGameStore.requestHint()
      expect(useGameStore.getState().hintsUsed).toBe(1)
    })
  })

  describe('autoSolve', () => {
    it('should solve the cube', async () => {
      useGameStore.scramble(5)
      await useGameStore.autoSolve()
      
      expect(useGameStore.getState().isSolved).toBe(true)
      expect(useGameStore.getState().solutionMoves.length).toBeGreaterThan(0)
      expect(useGameStore.getState().solverSolution).not.toBeNull()
      expect(useGameStore.getState().solverError).toBeNull()
    })

    it('should play solution moves one by one while solving', async () => {
      useGameStore.applyMove({ face: 'R', direction: 1 })
      useGameStore.applyMove({ face: 'U', direction: -1 })
      const playedMoves: string[] = []

      await useGameStore.autoSolve(async (move) => {
        expect(useGameStore.getState().isSolving).toBe(true)
        playedMoves.push(`${move.face}${move.direction}`)
      })

      expect(playedMoves).toEqual(['U1', 'R-1'])
      expect(useGameStore.getState().isSolving).toBe(false)
      expect(useGameStore.getState().isSolved).toBe(true)
    })

    it('should stop timer after solve', async () => {
      useGameStore.scramble(5)
      await useGameStore.autoSolve()
      
      expect(useGameStore.getState().isTimerRunning).toBe(false)
    })
  })
})
