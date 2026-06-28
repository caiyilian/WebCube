import type { CubeState as CubeStateType, Move } from '../../shared/types'

export class CubeState {
  public state: CubeStateType

  constructor() {
    this.state = this.createSolvedState()
  }

  // 创建已还原状态
  public createSolvedState(): CubeStateType {
    return {
      U: Array(9).fill('white'),
      D: Array(9).fill('yellow'),
      F: Array(9).fill('green'),
      B: Array(9).fill('blue'),
      L: Array(9).fill('orange'),
      R: Array(9).fill('red'),
    }
  }

  // 获取当前状态
  public getState(): CubeStateType {
    return { ...this.state }
  }

  // 设置状态
  public setState(state: CubeStateType): void {
    this.state = { ...state }
  }

  // 应用操作
  public applyMove(move: Move): void {
    const face = move[0] as keyof CubeStateType
    const isCounterClockwise = move.includes("'")
    
    // 旋转面
    this.rotateFace(face, isCounterClockwise)
    
    // 旋转相邻面
    this.rotateAdjacentFaces(face, isCounterClockwise)
  }

  // 旋转面
  private rotateFace(face: keyof CubeStateType, isCounterClockwise: boolean): void {
    const faceState = this.state[face]
    const newState = [...faceState]
    
    if (isCounterClockwise) {
      // 逆时针旋转
      newState[0] = faceState[2]
      newState[1] = faceState[5]
      newState[2] = faceState[8]
      newState[3] = faceState[1]
      newState[5] = faceState[7]
      newState[6] = faceState[0]
      newState[7] = faceState[3]
      newState[8] = faceState[6]
    } else {
      // 顺时针旋转
      newState[0] = faceState[6]
      newState[1] = faceState[3]
      newState[2] = faceState[0]
      newState[3] = faceState[7]
      newState[5] = faceState[1]
      newState[6] = faceState[8]
      newState[7] = faceState[5]
      newState[8] = faceState[2]
    }
    
    this.state[face] = newState
  }

  // 旋转相邻面
  private rotateAdjacentFaces(face: keyof CubeStateType, isCounterClockwise: boolean): void {
    const adjacentFaces: Record<string, { face: keyof CubeStateType; indices: number[] }[]> = {
      'R': [
        { face: 'U', indices: [2, 5, 8] },
        { face: 'F', indices: [2, 5, 8] },
        { face: 'D', indices: [2, 5, 8] },
        { face: 'B', indices: [6, 3, 0] },
      ],
      'L': [
        { face: 'U', indices: [6, 3, 0] },
        { face: 'B', indices: [2, 5, 8] },
        { face: 'D', indices: [6, 3, 0] },
        { face: 'F', indices: [6, 3, 0] },
      ],
      'U': [
        { face: 'B', indices: [0, 1, 2] },
        { face: 'R', indices: [0, 1, 2] },
        { face: 'F', indices: [0, 1, 2] },
        { face: 'L', indices: [0, 1, 2] },
      ],
      'D': [
        { face: 'F', indices: [6, 7, 8] },
        { face: 'R', indices: [6, 7, 8] },
        { face: 'B', indices: [6, 7, 8] },
        { face: 'L', indices: [6, 7, 8] },
      ],
      'F': [
        { face: 'U', indices: [6, 7, 8] },
        { face: 'R', indices: [0, 3, 6] },
        { face: 'D', indices: [2, 1, 0] },
        { face: 'L', indices: [8, 5, 2] },
      ],
      'B': [
        { face: 'U', indices: [2, 1, 0] },
        { face: 'L', indices: [0, 3, 6] },
        { face: 'D', indices: [6, 7, 8] },
        { face: 'R', indices: [8, 5, 2] },
      ],
    }

    const adjacent = adjacentFaces[face]
    if (!adjacent) return

    // 保存原始值
    const tempValues = adjacent.map(a => a.indices.map(i => this.state[a.face][i]))

    // 旋转相邻面
    for (let i = 0; i < adjacent.length; i++) {
      const nextIndex = isCounterClockwise 
        ? (i + 1) % adjacent.length 
        : (i + adjacent.length - 1) % adjacent.length
      
      const { face, indices } = adjacent[i]
      const sourceValues = tempValues[nextIndex]
      
      indices.forEach((idx, j) => {
        this.state[face][idx] = sourceValues[j]
      })
    }
  }

  // 检查是否已还原
  public isSolved(): boolean {
    const state = this.state
    return (
      state.U.every(c => c === 'white') &&
      state.D.every(c => c === 'yellow') &&
      state.F.every(c => c === 'green') &&
      state.B.every(c => c === 'blue') &&
      state.L.every(c => c === 'orange') &&
      state.R.every(c => c === 'red')
    )
  }

  // 序列化为字符串 (用于 cubejs)
  public serialize(): string {
    const state = this.state
    let result = ''
    
    // 按 cubejs 格式序列化
    const faceOrder: (keyof CubeStateType)[] = ['U', 'R', 'F', 'D', 'L', 'B']
    
    for (const face of faceOrder) {
      for (const color of state[face]) {
        switch (color) {
          case 'white': result += 'U'; break
          case 'yellow': result += 'D'; break
          case 'green': result += 'F'; break
          case 'blue': result += 'B'; break
          case 'orange': result += 'L'; break
          case 'red': result += 'R'; break
        }
      }
    }
    
    return result
  }

  // 从字符串反序列化
  public static deserialize(str: string): CubeState {
    const cubeState = new CubeState()
    const faceOrder: (keyof CubeStateType)[] = ['U', 'R', 'F', 'D', 'L', 'B']
    const colorMap: Record<string, string> = {
      'U': 'white', 'D': 'yellow', 'F': 'green',
      'B': 'blue', 'L': 'orange', 'R': 'red'
    }
    
    let index = 0
    for (const face of faceOrder) {
      for (let i = 0; i < 9; i++) {
        const colorKey = str[index]
        cubeState.state[face][i] = colorMap[colorKey] as any
        index++
      }
    }
    
    return cubeState
  }
}
