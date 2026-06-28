import { Move, CubeState } from '@shared/types.js'

// Standard cube notation moves
export type StandardMove = 
  | 'R' | "R'" | 'R2'
  | 'L' | "L'" | 'L2'
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'

export interface ScrambleResult {
  moves: StandardMove[]
  notation: string
}

// Face colors for solved state
const SOLVED_STATE: CubeState = {
  U: Array(9).fill('white'),
  D: Array(9).fill('yellow'),
  F: Array(9).fill('green'),
  B: Array(9).fill('blue'),
  L: Array(9).fill('orange'),
  R: Array(9).fill('red'),
}

const FACES: StandardMove['face'][] = ['R', 'L', 'U', 'D', 'F', 'B']
const DIRECTIONS = ['', "'", '2'] as const

/**
 * Generate a random scramble sequence
 * @param length Number of moves (default 20)
 * @returns ScrambleResult with moves array and notation string
 */
export function generateScramble(length: number = 20): ScrambleResult {
  const moves: StandardMove[] = []
  let lastFace = ''
  let lastLastFace = ''

  for (let i = 0; i < length; i++) {
    let face: StandardMove['face']
    
    // Avoid same face twice in a row, and avoid opposite faces consecutively
    do {
      face = FACES[Math.floor(Math.random() * FACES.length)]
    } while (face === lastFace || face === lastLastFace)

    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
    const move = `${face}${direction}` as StandardMove
    
    moves.push(move)
    lastLastFace = lastFace
    lastFace = face
  }

  return {
    moves,
    notation: moves.join(' '),
  }
}

/**
 * Parse a scramble notation string into moves array
 * @param notation Space-separated move notation (e.g., "R U R' U'")
 * @returns Array of StandardMove
 */
export function parseScramble(notation: string): StandardMove[] {
  return notation.trim().split(/\s+/).filter(m => m.length > 0) as StandardMove[]
}

/**
 * Invert a move (for undo)
 * @param move Standard move notation
 * @returns Inverted move
 */
export function invertMove(move: StandardMove): StandardMove {
  const face = move[0]
  const suffix = move.slice(1)
  
  switch (suffix) {
    case '':
      return `${face}'` as StandardMove
    case "'":
      return face as StandardMove
    case '2':
      return '2' as StandardMove
    default:
      return move
  }
}

/**
 * Invert a sequence of moves
 * @param moves Array of moves
 * @returns Inverted and reversed sequence
 */
export function invertSequence(moves: StandardMove[]): StandardMove[] {
  return [...moves].reverse().map(invertMove)
}

/**
 * Apply a scramble to a cube state
 * @param state Current cube state
 * @param scramble Scramble moves
 * @returns New cube state after applying scramble
 */
export function applyScramble(state: CubeState, scramble: StandardMove[]): CubeState {
  let newState = JSON.parse(JSON.stringify(state)) as CubeState
  
  for (const move of scramble) {
    newState = applyMove(newState, move)
  }
  
  return newState
}

/**
 * Apply a single move to cube state
 * @param state Current cube state
 * @param move Standard move notation
 * @returns New cube state
 */
function applyMove(state: CubeState, move: StandardMove): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  const face = move[0] as keyof CubeState
  const suffix = move.slice(1)
  
  let rotations = 1
  if (suffix === "'") rotations = 3 // Counter-clockwise = 3 clockwise rotations
  else if (suffix === '2') rotations = 2
  
  for (let i = 0; i < rotations; i++) {
    rotateFace(newState, face)
    rotateAdjacentStickers(newState, face)
  }
  
  return newState
}

/**
 * Rotate a face's stickers
 */
function rotateFace(state: CubeState, face: keyof CubeState): void {
  const stickers = state[face]
  // 3x3 rotation: indices 0-8
  // 0 1 2    6 3 0
  // 3 4 5 -> 7 4 1
  // 6 7 8    8 5 2
  const rotated = [
    stickers[6], stickers[3], stickers[0],
    stickers[7], stickers[4], stickers[1],
    stickers[8], stickers[5], stickers[2],
  ]
  state[face] = rotated
}

/**
 * Rotate adjacent face stickers when a face is turned
 */
function rotateAdjacentStickers(state: CubeState, face: keyof CubeState): void {
  // Adjacent face mappings for each face turn
  // Each entry: [face, indices] for the 3 stickers that move
  const adjacentMap: Record<keyof CubeState, Array<{ face: keyof CubeState; indices: number[] }>> = {
    R: [
      { face: 'U', indices: [2, 5, 8] },
      { face: 'F', indices: [2, 5, 8] },
      { face: 'D', indices: [2, 5, 8] },
      { face: 'B', indices: [6, 3, 0] }, // B face is mirrored
    ],
    L: [
      { face: 'U', indices: [0, 3, 6] },
      { face: 'B', indices: [8, 5, 2] },
      { face: 'D', indices: [0, 3, 6] },
      { face: 'F', indices: [0, 3, 6] },
    ],
    U: [
      { face: 'B', indices: [0, 1, 2] },
      { face: 'R', indices: [0, 1, 2] },
      { face: 'F', indices: [0, 1, 2] },
      { face: 'L', indices: [0, 1, 2] },
    ],
    D: [
      { face: 'F', indices: [6, 7, 8] },
      { face: 'R', indices: [6, 7, 8] },
      { face: 'B', indices: [6, 7, 8] },
      { face: 'L', indices: [6, 7, 8] },
    ],
    F: [
      { face: 'U', indices: [6, 7, 8] },
      { face: 'R', indices: [0, 3, 6] },
      { face: 'D', indices: [2, 1, 0] },
      { face: 'L', indices: [8, 5, 2] },
    ],
    B: [
      { face: 'U', indices: [2, 1, 0] },
      { face: 'L', indices: [0, 3, 6] },
      { face: 'D', indices: [6, 7, 8] },
      { face: 'R', indices: [8, 5, 2] },
    ],
  }

  const adjacents = adjacentMap[face]
  if (!adjacents) return

  // Extract stickers
  const strips = adjacents.map(a => a.indices.map(i => state[a.face][i]))

  // Rotate strips (last becomes first for clockwise)
  const last = strips[strips.length - 1]
  for (let i = strips.length - 1; i > 0; i--) {
    strips[i] = strips[i - 1]
  }
  strips[0] = last

  // Write back
  adjacents.forEach((a, idx) => {
    a.indices.forEach((faceIdx, stripIdx) => {
      state[a.face][faceIdx] = strips[idx][stripIdx]
    })
  })
}

/**
 * Check if cube is solved
 */
export function isSolved(state: CubeState): boolean {
  for (const [face, color] of Object.entries(SOLVED_STATE)) {
    if (!state[face as keyof CubeState].every(c => c === color[0])) {
      return false
    }
  }
  return true
}

/**
 * Get solved state
 */
export function getSolvedState(): CubeState {
  return JSON.parse(JSON.stringify(SOLVED_STATE))
}

/**
 * Convert our Move format to standard notation
 */
export function moveToNotation(move: Move): StandardMove {
  const suffix = move.direction === 1 ? '' : "'"
  return `${move.face}${suffix}` as StandardMove
}

/**
 * Convert standard notation to our Move format
 */
export function notationToMove(notation: StandardMove): Move {
  const face = notation[0] as Move['face']
  const suffix = notation.slice(1)
  const direction = suffix === "'" ? -1 : 1
  return { face, direction }
}
