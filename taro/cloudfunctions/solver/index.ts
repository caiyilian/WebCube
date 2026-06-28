// Cloud function for Rubik's Cube solver
// This runs on the WeChat Mini Program cloud environment

interface SolveRequest {
  cubeState: {
    U: string[]
    D: string[]
    F: string[]
    B: string[]
    L: string[]
    R: string[]
  }
}

interface SolveResponse {
  solution: string
  moves: string[]
  error?: string
}

// Simple solver using reverse scramble approach
// For production, use a proper Kociemba solver
function solveCube(state: SolveRequest['cubeState']): SolveResponse {
  // Generate a scramble and reverse it
  // This is a placeholder - real solver would use Kociemba algorithm
  const faces = ['R', 'L', 'U', 'D', 'F', 'B']
  const directions = ['', "'"]
  const moves: string[] = []

  // Generate 20 random moves and reverse them
  for (let i = 0; i < 20; i++) {
    const face = faces[Math.floor(Math.random() * faces.length)]
    const dir = directions[Math.floor(Math.random() * directions.length)]
    moves.unshift(`${face}${dir === "'" ? '' : "'"}`)
  }

  return {
    solution: moves.join(' '),
    moves
  }
}

// Main cloud function entry
export async function main(event: any, context: any): Promise<SolveResponse> {
  const { cubeState } = event as SolveRequest

  if (!cubeState) {
    return { solution: '', moves: [], error: 'Missing cubeState' }
  }

  const faces = ['U', 'D', 'F', 'B', 'L', 'R'] as const
  const valid = faces.every((face) => Array.isArray(cubeState[face]) && cubeState[face].length > 0)
  if (!valid) {
    return { solution: '', moves: [], error: 'Invalid cubeState' }
  }

  return solveCube(cubeState)
}
