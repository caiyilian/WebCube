import { solveCube, parseSolution } from './Solver.js'
import { CubeState, Move, HintData } from '@shared/types.js'

export type HintLevel = 1 | 2 | 3

export interface HintOptions {
  maxHints?: number
}

export class HintEngine {
  private hintsUsed = 0
  private maxHints = 3
  private hintLevel: HintLevel = 2

  constructor(options: HintOptions = {}) {
    this.maxHints = options.maxHints ?? 3
  }

  // 获取提示
  public async getHint(currentState: CubeState): Promise<HintData | null> {
    if (this.hintsUsed >= this.maxHints) {
      console.warn('Hints limit reached')
      return null
    }

    try {
      const solution = await solveCube(currentState)
      const moves = parseSolution(solution)
      
      if (moves.length === 0) {
        return null
      }

      const nextMove = moves[0]
      this.hintsUsed++

      return {
        move: this.formatMove(nextMove),
        layer: nextMove.face,
        direction: nextMove.direction === 1 ? 'clockwise' : 'counterclockwise',
        description: this.getMoveDescription(nextMove),
        highlightCubies: this.getCubiesForLayer(nextMove.face),
      }
    } catch (error) {
      console.error('Failed to get hint:', error)
      return null
    }
  }

  private formatMove(move: Move): string {
    return move.direction === 1 ? move.face : `${move.face}'`
  }

  private getMoveDescription(move: Move): string {
    const faceNames: Record<string, string> = {
      R: '右面',
      L: '左面',
      U: '上层',
      D: '下层',
      F: '前面',
      B: '后面',
    }

    const directionText = move.direction === 1 ? '顺时针' : '逆时针'
    const faceName = faceNames[move.face] || move.face

    if (this.hintLevel === 1) {
      return faceName
    } else if (this.hintLevel === 2) {
      return `${faceName} ${directionText}`
    } else {
      return `${faceName} ${directionText}旋转`
    }
  }

  private getCubiesForLayer(face: string): number[] {
    const layerMap: Record<string, number[]> = {
      R: [2, 5, 8, 11, 14, 17, 20, 23, 26],
      L: [0, 3, 6, 9, 12, 15, 18, 21, 24],
      U: [18, 19, 20, 21, 22, 23, 24, 25, 26],
      D: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      F: [2, 5, 8, 11, 14, 17, 20, 23, 26],
      B: [0, 3, 6, 9, 12, 15, 18, 21, 24],
    }

    return layerMap[face] || []
  }

  public resetHints(): void {
    this.hintsUsed = 0
  }

  public getHintsUsed(): number {
    return this.hintsUsed
  }

  public getMaxHints(): number {
    return this.maxHints
  }

  public setMaxHints(max: number): void {
    this.maxHints = max
  }

  public setHintLevel(level: HintLevel): void {
    this.hintLevel = level
  }

  public getHintLevel(): HintLevel {
    return this.hintLevel
  }

  public canUseHint(): boolean {
    return this.hintsUsed < this.maxHints
  }
}

// Singleton instance
let hintEngineInstance: HintEngine | null = null

export function getHintEngine(options?: HintOptions): HintEngine {
  if (!hintEngineInstance) {
    hintEngineInstance = new HintEngine(options)
  }
  return hintEngineInstance
}

export function resetHintEngine(): void {
  hintEngineInstance = null
}
