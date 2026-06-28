import { Move } from '@shared/types.js'

export interface ReplayFrame {
  move: Move
  timestamp: number
}

export interface ReplayData {
  frames: ReplayFrame[]
  duration: number
  moveCount: number
}

export class ReplayRecorder {
  private frames: ReplayFrame[] = []
  private startTime: number = 0
  private isRecording: boolean = false

  startRecording(): void {
    this.frames = []
    this.startTime = Date.now()
    this.isRecording = true
  }

  stopRecording(): void {
    this.isRecording = false
  }

  recordMove(move: Move): void {
    if (!this.isRecording) return
    this.frames.push({
      move,
      timestamp: Date.now() - this.startTime,
    })
  }

  getReplayData(): ReplayData {
    return {
      frames: [...this.frames],
      duration: this.frames.length > 0 ? this.frames[this.frames.length - 1].timestamp : 0,
      moveCount: this.frames.length,
    }
  }

  clear(): void {
    this.frames = []
    this.startTime = 0
  }
}

export class ReplayPlayer {
  private replayData: ReplayData | null = null
  private currentIndex: number = 0
  private isPlaying: boolean = false
  private playbackSpeed: number = 1
  private onFrame: ((move: Move, index: number) => void) | null = null
  private onComplete: (() => void) | null = null
  private animationFrameId: number | null = null
  private lastFrameTime: number = 0

  loadReplay(data: ReplayData): void {
    this.replayData = data
    this.currentIndex = 0
    this.isPlaying = false
  }

  setCallbacks(onFrame: (move: Move, index: number) => void, onComplete: () => void): void {
    this.onFrame = onFrame
    this.onComplete = onComplete
  }

  setSpeed(speed: number): void {
    this.playbackSpeed = speed
  }

  play(): void {
    if (!this.replayData || this.replayData.frames.length === 0) return
    this.isPlaying = true
    this.lastFrameTime = performance.now()
    this.playLoop()
  }

  pause(): void {
    this.isPlaying = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  reset(): void {
    this.currentIndex = 0
    this.isPlaying = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  getCurrentIndex(): number {
    return this.currentIndex
  }

  getTotalFrames(): number {
    return this.replayData?.frames.length || 0
  }

  private playLoop = (): void => {
    if (!this.isPlaying || !this.replayData) return

    const now = performance.now()
    const elapsed = (now - this.lastFrameTime) * this.playbackSpeed

    if (this.currentIndex < this.replayData.frames.length) {
      const frame = this.replayData.frames[this.currentIndex]
      if (elapsed >= frame.timestamp) {
        this.onFrame?.(frame.move, this.currentIndex)
        this.currentIndex++
        this.lastFrameTime = now
      }
      this.animationFrameId = requestAnimationFrame(this.playLoop)
    } else {
      this.isPlaying = false
      this.onComplete?.()
    }
  }
}
