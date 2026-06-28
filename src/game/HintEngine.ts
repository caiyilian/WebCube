import { Solver } from './Solver'
import { CubeState } from './CubeState'
import type { Move } from '../../shared/types'

export type HintLevel = 1 | 2 | 3

export interface Hint {
  move: Move
  layer: 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
  direction: 'clockwise' | 'counterclockwise'
  description: string
  highlightCubies: { x: number; y: number; z: number }[]
}

export class HintEngine {
  private solver: Solver
  private hintsUsed: number = 0
  private maxHints: number = 3

  constructor() {
    this.solver = new Solver()
  }

  // 获取提示
  public async getHint(cubeState: CubeState, level: HintLevel = 1): Promise<Hint | null> {
    if (this.hintsUsed >= this.maxHints) {
      console.warn('Hints limit reached')
      return null
    }

    try {
      const solution = await this.solver.solve(cubeState)
      const moves = solution.split(' ').filter(m => m.length > 0)
      
      if (moves.length === 0) {
        return null
      }

      const nextMove = moves[0] as Move
      const hint = this.parseMove(nextMove, level)
      
      this.hintsUsed++
      
      return hint
    } catch (error) {
      console.error('Failed to get hint:', error)
      return null
    }
  }

  // 解析操作
  private parseMove(move: Move, level: HintLevel): Hint {
    const face = move[0] as 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
    const isCounterClockwise = move.includes("'")
    
    return {
      move,
      layer: face,
      direction: isCounterClockwise ? 'counterclockwise' : 'clockwise',
      description: this.formatDescription(face, isCounterClockwise, level),
      highlightCubies: this.getCubiesForLayer(face)
    }
  }

  // 格式化描述
  private formatDescription(face: string, isCounterClockwise: boolean, level: HintLevel): string {
    const faceNames: Record<string, string> = {
      'R': '右面',
      'L': '左面',
      'U': '上面',
      'D': '下面',
      'F': '前面',
      'B': '后面'
    }
    
    const direction = isCounterClockwise ? '逆时针' : '顺时针'
    const faceName = faceNames[face] || face
    
    if (level === 1) {
      return `${faceName}`
    } else if (level === 2) {
      return `${faceName} ${direction}`
    } else {
      return `${faceName} ${direction}旋转`
    }
  }

  // 获取需要高亮的 cubelet
  private getCubiesForLayer(face: string): { x: number; y: number; z: number }[] {
    const cubies: { x: number; y: number; z: number }[] = []
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        switch (face) {
          case 'R':
            cubies.push({ x: 1, y: i, z: j })
            break
          case 'L':
            cubies.push({ x: -1, y: i, z: j })
            break
          case 'U':
            cubies.push({ x: i, y: 1, z: j })
            break
          case 'D':
            cubies.push({ x: i, y: -1, z: j })
            break
          case 'F':
            cubies.push({ x: i, y: j, z: 1 })
            break
          case 'B':
            cubies.push({ x: i, y: j, z: -1 })
            break
        }
      }
    }
    
    return cubies
  }

  // 重置提示计数
  public resetHintsUsed(): void {
    this.hintsUsed = 0
  }

  // 获取已使用提示数
  public getHintsUsed(): number {
    return this.hintsUsed
  }

  // 获取最大提示数
  public getMaxHints(): number {
    return this.maxHints
  }

  // 销毁
  public dispose(): void {
    this.solver.dispose()
  }
}
