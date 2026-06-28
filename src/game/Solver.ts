// Solver wrapper for cubejs (Kociemba algorithm)
// Runs in a Web Worker to avoid blocking the main thread

import { CubeState, Move } from '@shared/types.js'
import { moveToNotation, getSolvedState } from './Scramble.js'

// Worker message types
export type SolverMessageType = 
  | 'init'
  | 'solve'
  | 'scramble'
  | 'init-complete'
  | 'solve-complete'
  | 'scramble-complete'
  | 'error'

export interface SolverMessage {
  type: SolverMessageType
  payload?: any
  id: number
}

let messageId = 0
const pendingRequests = new Map<number, { resolve: Function; reject: Function }>()
let worker: Worker | null = null
let isInitialized = false

/**
 * Initialize the solver worker
 */
export async function initSolver(): Promise<void> {
  if (isInitialized) return

  return new Promise((resolve, reject) => {
    try {
      // Create worker from the solver worker file
      worker = new Worker(new URL('./workers/solver.worker.ts', import.meta.url), {
        type: 'module',
      })

      worker.onmessage = (event: MessageEvent<SolverMessage>) => {
        const { type, payload, id } = event.data
        const pending = pendingRequests.get(id)
        
        if (!pending) return

        switch (type) {
          case 'init-complete':
            isInitialized = true
            pending.resolve(payload)
            break
          case 'solve-complete':
            pending.resolve(payload)
            break
          case 'scramble-complete':
            pending.resolve(payload)
            break
          case 'error':
            pending.reject(new Error(payload.message))
            break
        }
        pendingRequests.delete(id)
      }

      worker.onerror = (error) => {
        reject(error)
      }

      // Send init message
      const id = ++messageId
      pendingRequests.set(id, { resolve, reject })
      worker.postMessage({ type: 'init', id })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Solve a cube state using Kociemba algorithm
 * @param cubeState Current cube state
 * @returns Solution as space-separated move notation
 */
export async function solveCube(cubeState: CubeState): Promise<string> {
  if (!isInitialized) {
    await initSolver()
  }

  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error('Worker not initialized'))
      return
    }

    const id = ++messageId
    pendingRequests.set(id, { resolve, reject })
    
    // Convert our cube state to cubejs format
    const cubejsState = convertToCubeJS(cubeState)
    
    worker.postMessage({
      type: 'solve',
      payload: { cubeState: cubejsState },
      id,
    })
  })
}

/**
 * Generate a random scramble
 * @returns Scramble notation string
 */
export async function generateScramble(): Promise<string> {
  if (!isInitialized) {
    await initSolver()
  }

  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error('Worker not initialized'))
      return
    }

    const id = ++messageId
    pendingRequests.set(id, { resolve, reject })
    worker.postMessage({ type: 'scramble', id })
  })
}

/**
 * Convert our cube state format to cubejs format
 * cubejs expects a 54-character string: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
 */
function convertToCubeJS(cubeState: CubeState): string {
  // Face order for cubejs: U, R, F, D, L, B
  // Each face has 9 stickers
  const faceOrder: (keyof CubeState)[] = ['U', 'R', 'F', 'D', 'L', 'B']
  
  let result = ''
  for (const face of faceOrder) {
    const stickers = cubeState[face]
    // Map our color names to cubejs single-letter codes
    const colorMap: Record<string, string> = {
      'white': 'U',
      'yellow': 'D',
      'green': 'F',
      'blue': 'B',
      'orange': 'L',
      'red': 'R',
    }
    
    for (const color of stickers) {
      result += colorMap[color] || 'U'
    }
  }
  
  return result
}

/**
 * Convert cubejs solution to our Move format
 */
export function parseSolution(solution: string): Move[] {
  const moves = solution.trim().split(/\s+/).filter(m => m.length > 0)
  return moves.map(notationToMove)
}

/**
 * Convert standard notation to our Move format
 */
function notationToMove(notation: string): Move {
  const face = notation[0] as Move['face']
  const suffix = notation.slice(1)
  const direction = suffix === "'" ? -1 : 1
  return { face, direction }
}

/**
 * Check if solver is ready
 */
export function isSolverReady(): boolean {
  return isInitialized
}

/**
 * Terminate the worker
 */
export function terminateSolver(): void {
  if (worker) {
    worker.terminate()
    worker = null
    isInitialized = false
    pendingRequests.clear()
  }
}
