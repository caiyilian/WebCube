import type { CubeSize, CubeState, Move } from '../stores/useGameStore'

export interface SolverWorkerRequest {
  cubeState: CubeState
  cubeSize: CubeSize
  moveHistory: Move[]
}

export interface SolverWorkerResult {
  solution: string
  moves: Move[]
}

interface SolverMessage {
  type: 'solve-complete' | 'error'
  id: string
  payload?: SolverWorkerResult
  error?: string
}

export function invertMoves(moves: Move[]): Move[] {
  return [...moves].reverse().map((move) => ({
    ...move,
    direction: (move.direction === 1 ? -1 : 1) as 1 | -1,
  }))
}

export function formatSolution(moves: Move[]): string {
  return moves.map((move) => `${move.face}${move.direction === -1 ? "'" : ''}`).join(' ')
}

function solveWithoutWorker(request: SolverWorkerRequest): SolverWorkerResult {
  const moves = invertMoves(request.moveHistory)
  return { solution: formatSolution(moves), moves }
}

export async function solveCubeWithWorker(request: SolverWorkerRequest): Promise<SolverWorkerResult> {
  if (typeof Worker === 'undefined') {
    return solveWithoutWorker(request)
  }

  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    const worker = new Worker(new URL('../../workers/solver.worker.ts', import.meta.url), { type: 'module' })
    const timeout = window.setTimeout(() => {
      worker.terminate()
      reject(new Error('求解超时，请稍后重试'))
    }, 10000)

    worker.onmessage = (event: MessageEvent<SolverMessage>) => {
      const message = event.data
      if (message.id !== id) return

      if (message.type === 'solve-complete' && message.payload) {
        window.clearTimeout(timeout)
        worker.terminate()
        resolve(message.payload)
      } else if (message.type === 'error') {
        window.clearTimeout(timeout)
        worker.terminate()
        reject(new Error(message.error || '求解失败'))
      }
    }

    worker.onerror = (event) => {
      window.clearTimeout(timeout)
      worker.terminate()
      reject(new Error(event.message || '求解 Worker 执行失败'))
    }

    worker.postMessage({ type: 'solve', payload: request, id })
  })
}
