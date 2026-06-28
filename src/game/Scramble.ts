import type { Move } from '../../shared/types'

// 所有可能的操作
const ALL_MOVES: Move[] = [
  'R', "R'", 'L', "L'",
  'U', "U'", 'D', "D'",
  'F', "F'", 'B', "B'"
]

// 生成随机打乱序列
export function generateScramble(length: number = 20): Move[] {
  const scramble: Move[] = []
  let lastMove: Move | '' = ''
  let secondLastMove: Move | '' = ''
  
  for (let i = 0; i < length; i++) {
    let move: Move
    
    // 避免重复操作和相反操作
    do {
      move = ALL_MOVES[Math.floor(Math.random() * ALL_MOVES.length)]
    } while (
      move === lastMove ||
      (lastMove !== '' && getFace(move) === getFace(lastMove)) ||
      (secondLastMove !== '' && getFace(move) === getFace(secondLastMove) && Math.abs(ALL_MOVES.indexOf(move) - ALL_MOVES.indexOf(secondLastMove)) <= 1)
    )
    
    scramble.push(move)
    secondLastMove = lastMove
    lastMove = move
  }
  
  return scramble
}

// 获取操作的面
function getFace(move: Move): string {
  return move[0]
}

// 将打乱序列转换为字符串
export function scrambleToString(scramble: Move[]): string {
  return scramble.join(' ')
}

// 应用打乱序列
export function applyScramble<T>(
  state: T,
  scramble: Move[],
  applyMove: (state: T, move: Move) => T
): T {
  let currentState = state
  
  for (const move of scramble) {
    currentState = applyMove(currentState, move)
  }
  
  return currentState
}
