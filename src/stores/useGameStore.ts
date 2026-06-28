import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CubeState {
  // Cube state: 6 faces, each with 9 stickers
  // U (Up/White), D (Down/Yellow), F (Front/Green), B (Back/Blue), L (Left/Orange), R (Right/Red)
  U: string[]
  D: string[]
  F: string[]
  B: string[]
  L: string[]
  R: string[]
}

export interface Move {
  face: 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
  direction: 1 | -1 // 1 = clockwise, -1 = counterclockwise
  layer?: number // For 4x4+, which layer (0-indexed)
}

export interface GameState {
  // Cube state
  cubeState: CubeState
  isSolved: boolean
  moveHistory: Move[]
  moveHistoryIndex: number // For undo/redo

  // Timer
  timerStartTime: number | null
  timerElapsed: number
  isTimerRunning: boolean

  // Settings
  animationDuration: number
  autoRotate: boolean
  showWireframe: boolean

  // Hint system
  currentHint: {
    move: string
    layer: string
    direction: 'clockwise' | 'counterclockwise'
    description: string
  } | null
  hintLevel: 1 | 2 | 3
  hintsUsed: number
  maxHints: number

  // Actions
  setCubeState: (state: CubeState) => void
  applyMove: (move: Move) => void
  undo: () => void
  redo: () => void
  resetCube: () => void
  scramble: (moves?: number) => void

  // Timer actions
  startTimer: () => void
  stopTimer: () => number
  resetTimer: () => void

  // Settings actions
  setAnimationDuration: (duration: number) => void
  setAutoRotate: (enabled: boolean) => void
  setShowWireframe: (enabled: boolean) => void

  // Hint actions
  setHint: (hint: GameState['currentHint']) => void
  clearHint: () => void
  setHintLevel: (level: 1 | 2 | 3) => void
  incrementHintsUsed: () => void
  setMaxHints: (max: number) => void
}

// Solved state
const SOLVED_STATE: CubeState = {
  U: Array(9).fill('white'),
  D: Array(9).fill('yellow'),
  F: Array(9).fill('green'),
  B: Array(9).fill('blue'),
  L: Array(9).fill('orange'),
  R: Array(9).fill('red'),
}

const FACE_COLORS: Record<keyof CubeState, string> = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  L: 'orange',
  R: 'red',
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      cubeState: SOLVED_STATE,
      isSolved: true,
      moveHistory: [],
      moveHistoryIndex: -1,

      timerStartTime: null,
      timerElapsed: 0,
      isTimerRunning: false,

      animationDuration: 200,
      autoRotate: false,
      showWireframe: false,

      currentHint: null,
      hintLevel: 2,
      hintsUsed: 0,
      maxHints: 3,

      // Actions
      setCubeState: (cubeState) => {
        const isSolved = checkSolved(cubeState)
        set({ cubeState, isSolved })
      },

      applyMove: (move) => {
        const { cubeState, moveHistory, moveHistoryIndex } = get()
        const newState = applyMoveToState(cubeState, move)
        const isSolved = checkSolved(newState)

        // Trim history after current index (for redo)
        const newHistory = moveHistory.slice(0, moveHistoryIndex + 1)
        newHistory.push(move)

        set({
          cubeState: newState,
          isSolved,
          moveHistory: newHistory,
          moveHistoryIndex: newHistory.length - 1,
        })

        // Auto-start timer on first move
        if (!get().isTimerRunning && moveHistory.length === 0) {
          get().startTimer()
        }
      },

      undo: () => {
        const { moveHistory, moveHistoryIndex } = get()
        if (moveHistoryIndex < 0) return

        const move = moveHistory[moveHistoryIndex]
        const inverseMove = { ...move, direction: -move.direction }
        let state = SOLVED_STATE

        // Replay all moves up to index - 1
        for (let i = 0; i < moveHistoryIndex; i++) {
          state = applyMoveToState(state, moveHistory[i])
        }

        set({
          cubeState: state,
          isSolved: checkSolved(state),
          moveHistoryIndex: moveHistoryIndex - 1,
        })
      },

      redo: () => {
        const { moveHistory, moveHistoryIndex } = get()
        if (moveHistoryIndex >= moveHistory.length - 1) return

        const nextIndex = moveHistoryIndex + 1
        const move = moveHistory[nextIndex]
        let state = SOLVED_STATE

        // Replay all moves up to nextIndex
        for (let i = 0; i <= nextIndex; i++) {
          state = applyMoveToState(state, moveHistory[i])
        }

        set({
          cubeState: state,
          isSolved: checkSolved(state),
          moveHistoryIndex: nextIndex,
        })
      },

      resetCube: () => {
        set({
          cubeState: SOLVED_STATE,
          isSolved: true,
          moveHistory: [],
          moveHistoryIndex: -1,
        })
        get().resetTimer()
        get().clearHint()
      },

      scramble: (moves = 20) => {
        const scrambleMoves = generateScramble(moves)
        let state = SOLVED_STATE

        for (const move of scrambleMoves) {
          state = applyMoveToState(state, move)
        }

        set({
          cubeState: state,
          isSolved: false,
          moveHistory: [...scrambleMoves],
          moveHistoryIndex: scrambleMoves.length - 1,
        })
        get().resetTimer()
        get().clearHint()
      },

      // Timer actions
      startTimer: () => {
        if (get().isTimerRunning) return
        set({
          timerStartTime: Date.now(),
          isTimerRunning: true,
        })
      },

      stopTimer: () => {
        const { timerStartTime, timerElapsed, isTimerRunning } = get()
        if (!isTimerRunning || !timerStartTime) return timerElapsed

        const elapsed = timerElapsed + (Date.now() - timerStartTime)
        set({
          timerElapsed: elapsed,
          timerStartTime: null,
          isTimerRunning: false,
        })
        return elapsed
      },

      resetTimer: () => {
        set({
          timerStartTime: null,
          timerElapsed: 0,
          isTimerRunning: false,
        })
      },

      // Settings actions
      setAnimationDuration: (duration) => set({ animationDuration: duration }),
      setAutoRotate: (enabled) => set({ autoRotate: enabled }),
      setShowWireframe: (enabled) => set({ showWireframe: enabled }),

      // Hint actions
      setHint: (hint) => set({ currentHint: hint }),
      clearHint: () => set({ currentHint: null }),
      setHintLevel: (level) => set({ hintLevel: level }),
      incrementHintsUsed: () => set((state) => ({ hintsUsed: state.hintsUsed + 1 })),
      setMaxHints: (max) => set({ maxHints: max }),
    }),
    {
      name: 'webcube-game-state',
      partialize: (state) => ({
        animationDuration: state.animationDuration,
        autoRotate: state.autoRotate,
        showWireframe: state.showWireframe,
        hintLevel: state.hintLevel,
        maxHints: state.maxHints,
      }),
    }
  )
)

// Helper functions
function checkSolved(state: CubeState): boolean {
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as const) {
    const color = FACE_COLORS[face]
    if (!state[face].every((c) => c === color)) {
      return false
    }
  }
  return true
}

function applyMoveToState(state: CubeState, move: Move): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  const { face, direction } = move

  // Face rotation mapping
  const faceMap: Record<string, { face: keyof CubeState; indices: number[] }> = {
    R: { face: 'R', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    L: { face: 'L', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    U: { face: 'U', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    D: { face: 'D', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    F: { face: 'F', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    B: { face: 'B', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  }

  // Rotate the face stickers
  const faceData = faceMap[face]
  if (faceData) {
    const stickers = newState[faceData.face]
    const rotated = rotateFace(stickers, direction)
    newState[faceData.face] = rotated
  }

  // Rotate adjacent face stickers (simplified - only face rotation for now)
  // Full implementation would rotate the adjacent layers
  rotateAdjacentStickers(newState, face, direction)

  return newState
}

function rotateFace(stickers: string[], direction: 1 | -1): string[] {
  // 3x3 face rotation
  // Indices:
  // 0 1 2
  // 3 4 5
  // 6 7 8
  if (direction === 1) {
    // Clockwise
    return [
      stickers[6], stickers[3], stickers[0],
      stickers[7], stickers[4], stickers[1],
      stickers[8], stickers[5], stickers[2],
    ]
  } else {
    // Counterclockwise
    return [
      stickers[2], stickers[5], stickers[8],
      stickers[1], stickers[4], stickers[7],
      stickers[0], stickers[3], stickers[6],
    ]
  }
}

function rotateAdjacentStickers(state: CubeState, face: string, direction: 1 | -1): void {
  // Simplified adjacent sticker rotation for 3x3
  // This is a placeholder - full implementation needs proper cube geometry
  const adjMap: Record<string, { face: keyof CubeState; indices: number[] }[]> = {
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

  const adjacents = adjMap[face]
  if (!adjacents) return

  // Extract stickers
  const strips = adjacents.map((a) => a.indices.map((i) => state[a.face][i]))

  // Rotate strips
  if (direction === 1) {
    // Clockwise: last becomes first
    const last = strips[strips.length - 1]
    for (let i = strips.length - 1; i > 0; i--) {
      strips[i] = strips[i - 1]
    }
    strips[0] = last
  } else {
    // Counterclockwise: first becomes last
    const first = strips[0]
    for (let i = 0; i < strips.length - 1; i++) {
      strips[i] = strips[i + 1]
    }
    strips[strips.length - 1] = first
  }

  // Write back
  adjacents.forEach((a, idx) => {
    a.indices.forEach((faceIdx, stripIdx) => {
      state[a.face][faceIdx] = strips[idx][stripIdx]
    })
  })
}

function generateScramble(moveCount: number): Move[] {
  const faces: Move['face'][] = ['R', 'L', 'U', 'D', 'F', 'B']
  const moves: Move[] = []
  let lastFace = ''
  let lastLastFace = ''

  for (let i = 0; i < moveCount; i++) {
    let face: Move['face']
    do {
      face = faces[Math.floor(Math.random() * faces.length)]
    } while (face === lastFace || face === lastLastFace)

    const direction = Math.random() < 0.5 ? 1 : -1
    moves.push({ face, direction })
    lastLastFace = lastFace
    lastFace = face
  }

  return moves
}