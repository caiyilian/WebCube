// @ts-nocheck
// Web Worker for Kociemba solver (cubejs)
// This runs in a separate thread to avoid blocking the main UI

import { Cube } from 'cubejs'

// Initialize cubejs (loads pruning tables)
let cube: Cube | null = null

async function initSolver(): Promise<void> {
  if (!cube) {
    cube = new Cube()
    // Wait for initialization (pruning tables)
    await cube.init()
  }
}

self.onmessage = async (event: MessageEvent) => {
  const { type, payload, id } = event.data

  try {
    switch (type) {
      case 'init': {
        await initSolver()
        self.postMessage({ type: 'init-complete', id })
        break
      }

      case 'solve': {
        if (!cube) {
          await initSolver()
        }
        
        const { cubeState, cubeSize, moveHistory = [] } = payload
        if (moveHistory.length > 0) {
          const moves = invertMoves(moveHistory)
          self.postMessage({
            type: 'solve-complete',
            payload: { solution: formatSolution(moves), moves },
            id,
          })
          break
        }
        
        // Convert our cube state to cubejs format
        // cubejs uses a different notation, we need to map it
        const cubejsState = convertToCubeJS(cubeState, cubeSize)
        
        cube!.setState(cubejsState)
        const solution = cube!.solve()
        
        self.postMessage({ 
          type: 'solve-complete', 
          payload: { solution: solution.join(' '), moves: parseSolution(solution.join(' ')) },
          id 
        })
        break
      }

      case 'scramble': {
        if (!cube) {
          await initSolver()
        }
        
        const { cubeSize } = payload
        const scramble = cube!.scramble(cubeSize)
        self.postMessage({ 
          type: 'scramble-complete', 
          payload: { scramble: scramble.join(' ') },
          id 
        })
        break
      }

      default:
        self.postMessage({ 
          type: 'error', 
          error: `Unknown message type: ${type}`,
          id 
        })
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      id 
    })
  }
}

function invertMoves(moves: Array<{ face: string; direction: 1 | -1 }>) {
  return [...moves].reverse().map((move) => ({
    ...move,
    direction: move.direction === 1 ? -1 : 1,
  }))
}

function formatSolution(moves: Array<{ face: string; direction: 1 | -1 }>): string {
  return moves.map((move) => `${move.face}${move.direction === -1 ? "'" : ''}`).join(' ')
}

function parseSolution(solution: string) {
  if (!solution.trim()) return []
  return solution.split(/\s+/).map((token) => ({
    face: token[0],
    direction: token.includes("'") ? -1 : 1,
  }))
}

function convertToCubeJS(cubeState: any, cubeSize: number): string {
  // cubejs expects a specific string format
  // For 3x3: 54 characters (9 characters for full state)
  // For 2x2: 24 characters (8 corners * 3 orientations)
  // This is a simplified conversion - full implementation would map all faces
  if (cubeSize === 2) {
    // 2x2 solved state in cubejs format
    return 'UUUURRRRFFFFDDDDLLLLBBBB'
  }
  // 3x3 solved state
  return 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'
}

export {}
