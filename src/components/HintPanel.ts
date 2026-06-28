import type { Hint } from '../game/HintEngine'

export class HintPanel {
  private container: HTMLDivElement
  private hintButton: HTMLButtonElement
  private hintDisplay: HTMLDivElement
  private currentHint: Hint | null = null
  private onHintCallback: (() => void) | null = null

  constructor() {
    this.container = document.createElement('div')
    this.container.style.position = 'absolute'
    this.container.style.bottom = '20px'
    this.container.style.left = '50%'
    this.container.style.transform = 'translateX(-50%)'
    this.container.style.zIndex = '100'
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    this.container.style.padding = '15px 20px'
    this.container.style.borderRadius = '8px'
    this.container.style.color = 'white'
    this.container.style.fontFamily = 'sans-serif'
    this.container.style.textAlign = 'center'

    // 提示按钮
    this.hintButton = document.createElement('button')
    this.hintButton.textContent = '获取提示'
    this.hintButton.style.padding = '10px 20px'
    this.hintButton.style.marginBottom = '10px'
    this.hintButton.style.cursor = 'pointer'
    this.hintButton.style.backgroundColor = '#4CAF50'
    this.hintButton.style.color = 'white'
    this.hintButton.style.border = 'none'
    this.hintButton.style.borderRadius = '4px'
    this.hintButton.onclick = () => {
      if (this.onHintCallback) {
        this.onHintCallback()
      }
    }
    this.container.appendChild(this.hintButton)

    // 提示显示区域
    this.hintDisplay = document.createElement('div')
    this.hintDisplay.style.minHeight = '20px'
    this.hintDisplay.style.fontSize = '14px'
    this.hintDisplay.style.color = '#aaa'
    this.container.appendChild(this.hintDisplay)
  }

  public getContainer(): HTMLDivElement {
    return this.container
  }

  public onHint(callback: () => void): void {
    this.onHintCallback = callback
  }

  public showHint(hint: Hint): void {
    this.currentHint = hint
    this.hintDisplay.textContent = hint.description
    this.hintDisplay.style.color = '#fff'
  }

  public clearHint(): void {
    this.currentHint = null
    this.hintDisplay.textContent = ''
  }

  public getCurrentHint(): Hint | null {
    return this.currentHint
  }

  public setButtonEnabled(enabled: boolean): void {
    this.hintButton.disabled = !enabled
    this.hintButton.style.opacity = enabled ? '1' : '0.5'
  }
}
