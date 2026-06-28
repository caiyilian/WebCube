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
        
        const { cubeState } = payload
        
        // Convert our cube state to cubejs format
        // cubejs uses a different notation, we need to map it
        const cubejsState = convertToCubeJS(cubeState)
        
        cube!.setState(cubejsState)
        const solution = cube!.solve()
        
        self.postMessage({ 
          type: 'solve-complete', 
          payload: { solution: solution.join(' ') },
          id 
        })
        break
      }

      case 'scramble': {
        if (!cube) {
          await initSolver()
        }
        
        const scramble = cube!.scramble()
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
          payload: { message: `Unknown message type: ${type}` },
          id 
        })
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      payload: { message: error instanceof Error ? error.message : 'Unknown error' },
      id 
    })
  }
}

function convertToCubeJS(cubeState: any): string {
  // cubejs expects a specific string format
  // This is a simplified conversion - full implementation would map all faces
  // For now, return solved state
  return 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'
}

export {}