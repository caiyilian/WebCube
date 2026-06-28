import { describe, expect, it } from 'vitest'
import { formatSolution, invertMoves, solveCubeWithWorker } from '../solver/SolverClient'
import type { SolverWorkerRequest } from '../solver/SolverClient'

const request: SolverWorkerRequest = {
  cubeSize: 3,
  cubeState: {
    U: Array(9).fill('white'),
    D: Array(9).fill('yellow'),
    F: Array(9).fill('green'),
    B: Array(9).fill('blue'),
    L: Array(9).fill('orange'),
    R: Array(9).fill('red'),
  },
  moveHistory: [
    { face: 'R', direction: 1 },
    { face: 'U', direction: -1 },
  ],
}

describe('SolverClient', () => {
  it('inverts move history into a legal solution sequence', () => {
    expect(invertMoves(request.moveHistory)).toEqual([
      { face: 'U', direction: 1 },
      { face: 'R', direction: -1 },
    ])
  })

  it('formats moves as cube notation', () => {
    expect(formatSolution(invertMoves(request.moveHistory))).toBe("U R'")
  })

  it('falls back to async history solving when Worker is unavailable', async () => {
    const result = await solveCubeWithWorker(request)

    expect(result.moves).toEqual([
      { face: 'U', direction: 1 },
      { face: 'R', direction: -1 },
    ])
    expect(result.solution).toBe("U R'")
  })
})
