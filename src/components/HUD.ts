export type GameMode = 'practice' | 'battle' | 'coop'

export interface HUDCallbacks {
  onScramble?: () => void
  onReset?: () => void
  onSolve?: () => void
  onHint?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSettingsToggle?: () => void
}

export class HUD {
  public element: HTMLElement
  public timerElement: HTMLElement
  
  private callbacks: HUDCallbacks = {}
  private hintBtn: HTMLButtonElement | null = null

  constructor(_mode: GameMode = 'practice') {
    void _mode // Mode used for future multiplayer features
    this.element = document.createElement('div')
    this.element.className = 'hud-container'
    this.element.innerHTML = `
      <div class="hud-row">
        <div class="hud-timer">0.000</div>
        <div class="hud-moves">0 步</div>
      </div>
      <div class="hud-row hud-buttons">
        <button class="hud-btn" data-action="scramble">打乱</button>
        <button class="hud-btn" data-action="reset">重置</button>
        <button class="hud-btn" data-action="solve">求解</button>
        <button class="hud-btn" data-action="hint">提示</button>
        <button class="hud-btn" data-action="undo">撤销</button>
        <button class="hud-btn" data-action="redo">重做</button>
        <button class="hud-btn" data-action="settings">设置</button>
      </div>
    `

    // Cache elements
    this.timerElement = this.element.querySelector('.hud-timer')!

    // Bind click events
    this.element.querySelectorAll('.hud-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).dataset.action
        this.handleAction(action!)
      })
    })
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'scramble': this.callbacks.onScramble?.(); break
      case 'reset': this.callbacks.onReset?.(); break
      case 'solve': this.callbacks.onSolve?.(); break
      case 'hint': this.callbacks.onHint?.(); break
      case 'undo': this.callbacks.onUndo?.(); break
      case 'redo': this.callbacks.onRedo?.(); break
      case 'settings': this.callbacks.onSettingsToggle?.(); break
    }
  }

  public setMoveCount(count: number): void {
    const movesEl = this.element.querySelector('.hud-moves')
    if (movesEl) movesEl.textContent = `${count} 步`
  }

  public setTimerDisplay(text: string): void {
    this.timerElement.textContent = text
  }

  public setHintActive(active: boolean): void {
    if (this.hintBtn) {
      this.hintBtn.classList.toggle('active', active)
    }
  }

  public hideHintButton(): void {
    if (this.hintBtn) {
      this.hintBtn.style.display = 'none'
    }
  }

  public setCallbacks(callbacks: HUDCallbacks): void {
    this.callbacks = callbacks
  }
}
