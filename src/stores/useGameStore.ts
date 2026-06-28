export interface CubeState {
  U: string[]
  D: string[]
  F: string[]
  B: string[]
  L: string[]
  R: string[]
}

export interface Move {
  face: 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
  direction: 1 | -1
}

export interface GameState {
  cubeState: CubeState
  isSolved: boolean
  moveHistory: Move[]
  moveHistoryIndex: number
  timerStartTime: number | null
  timerElapsed: number
  isTimerRunning: boolean
  animationDuration: number
  currentHint: {
    move: string
    layer: string
    direction: 'clockwise' | 'counterclockwise'
    description: string
  } | null
  hintLevel: 1 | 2 | 3
  hintsUsed: number
  maxHints: number
  isSolving: boolean
}

type Listener = (state: GameState) => void

const SOLVED_STATE: CubeState = {
  U: Array(9).fill('white'),
  D: Array(9).fill('yellow'),
  F: Array(9).fill('green'),
  B: Array(9).fill('blue'),
  L: Array(9).fill('orange'),
  R: Array(9).fill('red'),
}

function applyMoveToState(state: CubeState, move: Move): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState
  const { face, direction } = move

  const stickers = newState[face]
  if (direction === 1) {
    newState[face] = [stickers[6], stickers[3], stickers[0], stickers[7], stickers[4], stickers[1], stickers[8], stickers[5], stickers[2]]
  } else {
    newState[face] = [stickers[2], stickers[5], stickers[8], stickers[1], stickers[4], stickers[7], stickers[0], stickers[3], stickers[6]]
  }

  const adjMap: Record<string, { face: keyof CubeState; indices: number[] }[]> = {
    R: [{ face: 'U', indices: [2, 5, 8] }, { face: 'F', indices: [2, 5, 8] }, { face: 'D', indices: [2, 5, 8] }, { face: 'B', indices: [6, 3, 0] }],
    L: [{ face: 'U', indices: [0, 3, 6] }, { face: 'B', indices: [8, 5, 2] }, { face: 'D', indices: [0, 3, 6] }, { face: 'F', indices: [0, 3, 6] }],
    U: [{ face: 'B', indices: [0, 1, 2] }, { face: 'R', indices: [0, 1, 2] }, { face: 'F', indices: [0, 1, 2] }, { face: 'L', indices: [0, 1, 2] }],
    D: [{ face: 'F', indices: [6, 7, 8] }, { face: 'R', indices: [6, 7, 8] }, { face: 'B', indices: [6, 7, 8] }, { face: 'L', indices: [6, 7, 8] }],
    F: [{ face: 'U', indices: [6, 7, 8] }, { face: 'R', indices: [0, 3, 6] }, { face: 'D', indices: [2, 1, 0] }, { face: 'L', indices: [8, 5, 2] }],
    B: [{ face: 'U', indices: [2, 1, 0] }, { face: 'L', indices: [0, 3, 6] }, { face: 'D', indices: [6, 7, 8] }, { face: 'R', indices: [8, 5, 2] }],
  }

  const adjacents = adjMap[face]
  if (adjacents) {
    const strips = adjacents.map((a) => a.indices.map((i) => newState[a.face][i]))
    if (direction === 1) {
      const last = strips[strips.length - 1]
      for (let i = strips.length - 1; i > 0; i--) strips[i] = strips[i - 1]
      strips[0] = last
    } else {
      const first = strips[0]
      for (let i = 0; i < strips.length - 1; i++) strips[i] = strips[i + 1]
      strips[strips.length - 1] = first
    }
    adjacents.forEach((a, idx) => {
      a.indices.forEach((faceIdx, stripIdx) => {
        newState[a.face][faceIdx] = strips[idx][stripIdx]
      })
    })
  }

  return newState
}

function checkSolved(state: CubeState): boolean {
  const colors: Record<string, string> = { U: 'white', D: 'yellow', F: 'green', B: 'blue', L: 'orange', R: 'red' }
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as const) {
    if (!state[face].every((c) => c === colors[face])) return false
  }
  return true
}

function generateScramble(moveCount: number): Move[] {
  const faces: Move['face'][] = ['R', 'L', 'U', 'D', 'F', 'B']
  const moves: Move[] = []
  let lastFace = ''
  let lastLastFace = ''
  for (let i = 0; i < moveCount; i++) {
    let face: Move['face']
    do { face = faces[Math.floor(Math.random() * faces.length)] } while (face === lastFace || face === lastLastFace)
    moves.push({ face, direction: Math.random() < 0.5 ? 1 : -1 })
    lastLastFace = lastFace
    lastFace = face
  }
  return moves
}

class Store {
  private state: GameState = {
    cubeState: { ...SOLVED_STATE },
    isSolved: true,
    moveHistory: [],
    moveHistoryIndex: -1,
    timerStartTime: null,
    timerElapsed: 0,
    isTimerRunning: false,
    animationDuration: 200,
    currentHint: null,
    hintLevel: 2,
    hintsUsed: 0,
    maxHints: 3,
    isSolving: false,
  }
  private listeners: Set<Listener> = new Set()

  getState(): GameState { return this.state }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private setState(partial: Partial<GameState>): void {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((l) => l(this.state))
  }

  // Actions
  applyMove(move: Move): void {
    const { cubeState, moveHistory, moveHistoryIndex } = this.state
    const newState = applyMoveToState(cubeState, move)
    const newHistory = moveHistory.slice(0, moveHistoryIndex + 1)
    newHistory.push(move)
    this.setState({
      cubeState: newState,
      isSolved: checkSolved(newState),
      moveHistory: newHistory,
      moveHistoryIndex: newHistory.length - 1,
    })
    if (!this.state.isTimerRunning && moveHistory.length === 0) this.startTimer()
  }

  undo(): void {
    const { moveHistory, moveHistoryIndex } = this.state
    if (moveHistoryIndex < 0) return
    let state = { ...SOLVED_STATE }
    for (let i = 0; i < moveHistoryIndex; i++) state = applyMoveToState(state, moveHistory[i])
    this.setState({ cubeState: state, isSolved: checkSolved(state), moveHistoryIndex: moveHistoryIndex - 1 })
  }

  redo(): void {
    const { moveHistory, moveHistoryIndex } = this.state
    if (moveHistoryIndex >= moveHistory.length - 1) return
    let state = { ...SOLVED_STATE }
    for (let i = 0; i <= moveHistoryIndex + 1; i++) state = applyMoveToState(state, moveHistory[i])
    this.setState({ cubeState: state, isSolved: checkSolved(state), moveHistoryIndex: moveHistoryIndex + 1 })
  }

  resetCube(): void {
    this.setState({
      cubeState: { ...SOLVED_STATE },
      isSolved: true,
      moveHistory: [],
      moveHistoryIndex: -1,
      currentHint: null,
    })
    this.resetTimer()
  }

  scramble(moves = 20): void {
    const scrambleMoves = generateScramble(moves)
    let state = { ...SOLVED_STATE }
    for (const move of scrambleMoves) state = applyMoveToState(state, move)
    this.setState({
      cubeState: state,
      isSolved: false,
      moveHistory: [...scrambleMoves],
      moveHistoryIndex: scrambleMoves.length - 1,
    })
    this.resetTimer()
  }

  startTimer(): void {
    if (this.state.isTimerRunning) return
    this.setState({ timerStartTime: Date.now(), isTimerRunning: true })
  }

  stopTimer(): number {
    const { timerStartTime, timerElapsed, isTimerRunning } = this.state
    if (!isTimerRunning || !timerStartTime) return timerElapsed
    const elapsed = timerElapsed + (Date.now() - timerStartTime)
    this.setState({ timerElapsed: elapsed, timerStartTime: null, isTimerRunning: false })
    return elapsed
  }

  resetTimer(): void {
    this.setState({ timerStartTime: null, timerElapsed: 0, isTimerRunning: false })
  }

  setAnimationDuration(duration: number): void { this.setState({ animationDuration: duration }) }

  setHint(hint: GameState['currentHint']): void { this.setState({ currentHint: hint }) }
  clearHint(): void { this.setState({ currentHint: null }) }
  setHintLevel(level: 1 | 2 | 3): void { this.setState({ hintLevel: level }) }

  async requestHint(): Promise<void> {
    const { hintsUsed, maxHints, moveHistory } = this.state
    if (hintsUsed >= maxHints) return
    if (moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1]
      const reverseMove = lastMove.direction === -1 ? 'clockwise' : 'counterclockwise'
      const faceName = { R: '右', L: '左', U: '上', D: '下', F: '前', B: '后' }[lastMove.face]
      this.setState({
        currentHint: { move: lastMove.face, layer: lastMove.face, direction: reverseMove, description: `${faceName}面${reverseMove === 'clockwise' ? '顺时针' : '逆时针'}旋转` },
        hintsUsed: hintsUsed + 1,
      })
    } else {
      this.setState({
        currentHint: { move: 'R', layer: 'R', direction: 'clockwise', description: '右面顺时针旋转' },
        hintsUsed: hintsUsed + 1,
      })
    }
  }

  async autoSolve(): Promise<void> {
    if (this.state.isSolving) return
    this.setState({ isSolving: true })
    this.setState({
      cubeState: { ...SOLVED_STATE },
      isSolved: true,
      isSolving: false,
      moveHistory: [],
      moveHistoryIndex: -1,
    })
    this.stopTimer()
    this.clearHint()
  }
}

export const useGameStore = new Store()
