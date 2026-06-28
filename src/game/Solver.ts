import type { CubeState } from './CubeState'

// 求解器响应类型
interface SolverResponse {
  type: 'solution' | 'error'
  solution?: string
  error?: string
}

export class Solver {
  private worker: Worker | null = null
  private isReady: boolean = false
  private pendingResolve: ((solution: string) => void) | null = null
  private pendingReject: ((error: Error) => void) | null = null

  constructor() {
    this.initWorker()
  }

  private initWorker(): void {
    // 创建 Worker
    const workerCode = `
      // cubejs 求解器 Worker
      self.onmessage = async function(e) {
        const { type, state } = e.data
        
        if (type === 'solve') {
          try {
            // 动态导入 cubejs
            const cubejs = await import('https://cdn.jsdelivr.net/npm/cubejs@1.3.0/+esm')
            
            // 创建求解器
            const solver = new cubejs.default()
            
            // 求解
            const solution = solver.solve(state)
            
            self.postMessage({
              type: 'solution',
              solution
            })
          } catch (error) {
            self.postMessage({
              type: 'error',
              error: error.message
            })
          }
        }
      }
    `

    // 创建 Blob URL
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)

    // 创建 Worker
    this.worker = new Worker(workerUrl)
    
    this.worker.onmessage = (e) => {
      const response: SolverResponse = e.data
      
      if (response.type === 'solution' && this.pendingResolve) {
        this.pendingResolve(response.solution!)
        this.pendingResolve = null
        this.pendingReject = null
      } else if (response.type === 'error' && this.pendingReject) {
        this.pendingReject(new Error(response.error))
        this.pendingResolve = null
        this.pendingReject = null
      }
    }

    this.worker.onerror = (error) => {
      console.error('Solver worker error:', error)
      if (this.pendingReject) {
        this.pendingReject(new Error('Worker error'))
        this.pendingResolve = null
        this.pendingReject = null
      }
    }

    this.isReady = true
  }

  // 求解魔方
  public solve(cubeState: CubeState): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.worker || !this.isReady) {
        reject(new Error('Solver not ready'))
        return
      }

      this.pendingResolve = resolve
      this.pendingReject = reject

      // 序列化状态
      const stateString = cubeState.serialize()

      // 发送到 Worker
      this.worker.postMessage({
        type: 'solve',
        state: stateString
      })
    })
  }

  // 销毁 Worker
  public dispose(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.isReady = false
    }
  }
}
