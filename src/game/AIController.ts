import { Move } from '@shared/types.js'

export type AIDifficulty = 'easy' | 'medium' | 'hard'

export interface AIOpponent {
  id: string
  name: string
  difficulty: AIDifficulty
  solving: boolean
}

export class AIController {
  private ai: AIOpponent | null = null
  private moves: Move[] = []
  private currentMoveIndex: number = 0
  private intervalId: number | null = null
  private onMove: ((move: Move) => void) | null = null

  createAI(difficulty: AIDifficulty): AIOpponent {
    const names: Record<AIDifficulty, string> = {
      easy: 'AI 新手',
      medium: 'AI 高手',
      hard: 'AI 大师',
    }
    this.ai = {
      id: 'ai-opponent',
      name: names[difficulty],
      difficulty,
      solving: false,
    }
    return this.ai
  }

  startSolving(scramble: string): void {
    if (!this.ai) return
    this.ai.solving = true

    // Generate solving moves based on difficulty
    this.moves = this.generateSolvingMoves(scramble)
    this.currentMoveIndex = 0

    // Set interval based on difficulty
    const intervals: Record<AIDifficulty, number> = {
      easy: 800,   // Slow
      medium: 400, // Medium
      hard: 150,   // Fast
    }
    const interval = this.ai.difficulty === 'easy' ? intervals.easy :
                    this.ai.difficulty === 'medium' ? intervals.medium :
                    intervals.hard

    const solveStep = () => {
      if (this.currentMoveIndex >= this.moves.length) {
        this.stopSolving()
        return
      }
      const move = this.moves[this.currentMoveIndex]
      this.onMove?.(move)
      this.currentMoveIndex++
    }

    this.intervalId = window.setInterval(solveStep, interval)
  }

  stopSolving(): void {
    this.ai!.solving = false
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  isSolving(): boolean {
    return this.ai?.solving || false
  }

  getAI(): AIOpponent | null {
    return this.ai
  }

  setOnMove(callback: (move: Move) => void): void {
    this.onMove = callback
  }

  private generateSolvingMoves(scramble: string): Move[] {
    // Simple AI: reverse the scramble moves
    const moves: Move[] = []
    const faces: Array<'R' | 'L' | 'U' | 'D' | 'F' | 'B'> = ['R', 'L', 'U', 'D', 'F', 'B']
    
    // Parse scramble moves
    const scrambleMoves = scramble.split(' ').filter(m => m.length > 0)
    for (const sm of scrambleMoves.reverse()) {
      const face = sm[0] as 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
      if (faces.includes(face)) {
        // Reverse the direction
        const direction = sm.includes("'") ? 1 : -1
        moves.push({ face, direction })
      }
    }

    return moves
  }
}
