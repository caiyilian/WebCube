import { Timer } from './Timer'

export class HUD {
  private container: HTMLDivElement
  private timer: Timer
  private timeDisplay: HTMLSpanElement
  private moveCountDisplay: HTMLSpanElement
  private moveCount: number = 0

  constructor() {
    this.container = document.createElement('div')
    this.container.style.position = 'absolute'
    this.container.style.top = '20px'
    this.container.style.right = '20px'
    this.container.style.zIndex = '100'
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    this.container.style.padding = '15px 20px'
    this.container.style.borderRadius = '8px'
    this.container.style.color = 'white'
    this.container.style.fontFamily = 'monospace'
    this.container.style.fontSize = '18px'

    // 计时器显示
    const timerLabel = document.createElement('div')
    timerLabel.textContent = '时间'
    timerLabel.style.marginBottom = '5px'
    timerLabel.style.fontSize = '12px'
    timerLabel.style.color = '#aaa'
    this.container.appendChild(timerLabel)

    this.timeDisplay = document.createElement('span')
    this.timeDisplay.textContent = '00:00.00'
    this.timeDisplay.style.display = 'block'
    this.timeDisplay.style.fontSize = '24px'
    this.timeDisplay.style.fontWeight = 'bold'
    this.container.appendChild(this.timeDisplay)

    // 操作计数显示
    const moveLabel = document.createElement('div')
    moveLabel.textContent = '步数'
    moveLabel.style.marginTop = '10px'
    moveLabel.style.marginBottom = '5px'
    moveLabel.style.fontSize = '12px'
    moveLabel.style.color = '#aaa'
    this.container.appendChild(moveLabel)

    this.moveCountDisplay = document.createElement('span')
    this.moveCountDisplay.textContent = '0'
    this.moveCountDisplay.style.display = 'block'
    this.moveCountDisplay.style.fontSize = '24px'
    this.moveCountDisplay.style.fontWeight = 'bold'
    this.container.appendChild(this.moveCountDisplay)

    // 创建计时器
    this.timer = new Timer()
    this.timer.onUpdate((time) => {
      this.timeDisplay.textContent = time
    })
  }

  public getContainer(): HTMLDivElement {
    return this.container
  }

  public startTimer(): void {
    this.timer.start()
  }

  public stopTimer(): void {
    this.timer.stop()
  }

  public resetTimer(): void {
    this.timer.reset()
    this.moveCount = 0
    this.updateMoveCount()
  }

  public incrementMoveCount(): void {
    this.moveCount++
    this.updateMoveCount()
  }

  private updateMoveCount(): void {
    this.moveCountDisplay.textContent = this.moveCount.toString()
  }

  public getTimer(): Timer {
    return this.timer
  }

  public getMoveCount(): number {
    return this.moveCount
  }
}
