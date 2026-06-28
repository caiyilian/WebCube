import { describe, expect, it } from 'vitest'
import { RoomManager } from './RoomManager'
import type { CubeState, Move } from '../../shared/types'

function createManager(): RoomManager {
  return new RoomManager({ to: () => ({ emit: () => undefined }) } as never)
}

function callPrivate<T>(manager: RoomManager, name: string, ...args: unknown[]): T {
  return (manager as unknown as Record<string, (...values: unknown[]) => T>)[name](...args)
}

describe('RoomManager cube state', () => {
  it('applies scramble to a solved state', () => {
    const manager = createManager()
    const state = callPrivate<CubeState>(manager, 'applyScramble', 'R U', 3)

    expect(callPrivate<boolean>(manager, 'isSolved', state)).toBe(false)
    expect(state.U).not.toEqual(Array(9).fill('white'))
  })

  it.each([2, 3, 4] as const)('applies a move and its inverse for %ix%i', (size) => {
    const manager = createManager()
    const solved = callPrivate<CubeState>(manager, 'createSolvedState', size)
    const moved = callPrivate<CubeState>(manager, 'applyMoveToState', solved, { face: 'R', direction: 1 } satisfies Move)
    const restored = callPrivate<CubeState>(manager, 'applyMoveToState', moved, { face: 'R', direction: -1 } satisfies Move)

    expect(restored).toEqual(solved)
    expect(callPrivate<boolean>(manager, 'isSolved', restored)).toBe(true)
  })

  it.each([2, 3, 4] as const)('returns to solved after four turns for %ix%i', (size) => {
    const manager = createManager()
    const solved = callPrivate<CubeState>(manager, 'createSolvedState', size)
    let state = solved
    for (let i = 0; i < 4; i++) {
      state = callPrivate<CubeState>(manager, 'applyMoveToState', state, { face: 'F', direction: 1 } satisfies Move)
    }

    expect(state).toEqual(solved)
    expect(callPrivate<boolean>(manager, 'isSolved', state)).toBe(true)
  })
})
