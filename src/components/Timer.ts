export class Timer {
  private startTime: number = 0
  private elapsedTime: number = 0
  private isRunning: boolean = false
  private animationFrameId: number | null = null
  private updateCallback: ((time: string) => void) | null = null

  constructor() {
    this.update = this.update.bind(this)
  }

  public onUpdate(callback: (time: string) => void): void {
    this.updateCallback = callback
  }

  public start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.startTime = performance.now() - this.elapsedTime
    this.update()
  }

  public stop(): void {
    if (!this.isRunning) return
    
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public reset(): void {
    this.stop()
    this.elapsedTime = 0
    this.updateDisplay()
  }

  private update(): void {
    if (!this.isRunning) return
    
    this.elapsedTime = performance.now() - this.startTime
    this.updateDisplay()
    this.animationFrameId = requestAnimationFrame(this.update)
  }

  private updateDisplay(): void {
    if (this.updateCallback) {
      this.updateCallback(this.formatTime(this.elapsedTime))
    }
  }

  private formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = Math.floor((ms % 1000) / 10)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  public getTime(): number {
    return this.elapsedTime
  }

  public getIsRunning(): boolean {
    return this.isRunning
  }
}
