export class HUD {
  public element: HTMLElement
  private timerElement: HTMLElement
  private moveCountElement: HTMLElement
  private scrambleButton: HTMLButtonElement
  private resetButton: HTMLButtonElement
  private solveButton: HTMLButtonElement
  private hintButton: HTMLButtonElement
  private undoButton: HTMLButtonElement
  private redoButton: HTMLButtonElement
  private startTime: number = 0
  private timerInterval: number | null = null
  private isRunning: boolean = false

  constructor() {
    this.element = document.createElement('div')
    this.element.id = 'hud'
    this.element.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      pointer-events: none;
      z-index: 100;
    `

    // Left panel - Timer and move count
    const leftPanel = document.createElement('div')
    leftPanel.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: auto;
    `

    // Timer
    this.timerElement = document.createElement('div')
    this.timerElement.id = 'timer'
    this.timerElement.style.cssText = `
      font-size: 48px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
      color: #fff;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    `
    this.timerElement.textContent = '0.000'

    // Move count
    this.moveCountElement = document.createElement('div')
    this.moveCountElement.id = 'move-count'
    this.moveCountElement.style.cssText = `
      font-size: 18px;
      color: #aaa;
      font-variant-numeric: tabular-nums;
    `
    this.moveCountElement.textContent = '步数: 0'

    leftPanel.appendChild(this.timerElement)
    leftPanel.appendChild(this.moveCountElement)

    // Right panel - Controls
    const rightPanel = document.createElement('div')
    rightPanel.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: auto;
    `

    const buttonStyle = `
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
      min-width: 100px;
    `
    const buttonHoverStyle = `
      background: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.4);
      transform: translateY(-1px);
    `

    this.scrambleButton = this.createButton('打乱', buttonStyle, buttonHoverStyle, () => {
      this.onScramble?.()
    })
    this.resetButton = this.createButton('重置', buttonStyle, buttonHoverStyle, () => {
      this.onReset?.()
    })
    this.solveButton = this.createButton('自动还原', buttonStyle, buttonHoverStyle, () => {
      this.onSolve?.()
    })
    this.hintButton = this.createButton('提示', buttonStyle, buttonHoverStyle, () => {
      this.onHint?.()
    })
    this.undoButton = this.createButton('撤销 (Z)', buttonStyle, buttonHoverStyle, () => {
      this.onUndo?.()
    })
    this.redoButton = this.createButton('重做 (Y)', buttonStyle, buttonHoverStyle, () => {
      this.onRedo?.()
    })

    rightPanel.append(
      this.scrambleButton,
      this.resetButton,
      this.solveButton,
      this.hintButton,
      this.undoButton,
      this.redoButton
    )

    this.element.appendChild(leftPanel)
    this.element.appendChild(rightPanel)

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        this.onUndo?.()
      } else if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && e.shiftKey && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        this.onRedo?.()
      } else if (e.key === ' ') {
        e.preventDefault()
        if (this.isRunning) {
          this.stopTimer()
        } else {
          this.startTimer()
        }
      } else if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        this.onReset?.()
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        this.onScramble?.()
      }
    })
  }

  private createButton(
    text: string,
    baseStyle: string,
    hoverStyle: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = text
    button.style.cssText = baseStyle
    button.addEventListener('mouseenter', () => {
      button.style.cssText = baseStyle + hoverStyle
    })
    button.addEventListener('mouseleave', () => {
      button.style.cssText = baseStyle
    })
    button.addEventListener('click', onClick)
    return button
  }

  // Callbacks
  public onScramble?: () => void
  public onReset?: () => void
  public onSolve?: () => void
  public onHint?: () => void
  public onUndo?: () => void
  public onRedo?: () => void

  // Timer methods
  public startTimer(): void {
    if (this.isRunning) return
    this.startTime = Date.now()
    this.isRunning = true
    this.timerInterval = window.setInterval(() => this.updateTimer(), 10)
  }

  public stopTimer(): number {
    if (!this.isRunning) return this.getElapsedTime()
    this.isRunning = false
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    return this.getElapsedTime()
  }

  public resetTimer(): void {
    this.stopTimer()
    this.startTime = 0
    this.timerElement.textContent = '0.000'
  }

  public getElapsedTime(): number {
    if (!this.startTime) return 0
    return (this.isRunning ? Date.now() : this.startTime + (this.timerInterval ? 0 : 0)) - this.startTime
  }

  private updateTimer(): void {
    const elapsed = this.getElapsedTime()
    const seconds = (elapsed / 1000).toFixed(3)
    this.timerElement.textContent = seconds
  }

  public setMoveCount(count: number): void {
    this.moveCountElement.textContent = `步数: ${count}`
  }
}