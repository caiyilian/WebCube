export interface SettingsData {
  animationSpeed: number
  hintLevel: 1 | 2 | 3
}

export class Settings {
  public element: HTMLElement
  private panel: HTMLElement
  private isOpen = false
  private settings: SettingsData = {
    animationSpeed: 200,
    hintLevel: 2
  }

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'settings-container'
    this.element.innerHTML = `
      <button class="hud-btn settings-toggle">⚙️</button>
      <div class="settings-panel">
        <div class="settings-title">设置</div>
        <div class="settings-item">
          <label>动画速度</label>
          <input type="range" class="settings-speed" min="50" max="500" value="200" step="50">
          <span class="settings-speed-value">200ms</span>
        </div>
        <div class="settings-item">
          <label>提示级别</label>
          <select class="settings-hint-level">
            <option value="1">Level 1 - 仅层高亮</option>
            <option value="2" selected>Level 2 - 高亮 + 方向</option>
            <option value="3">Level 3 - 高亮 + 方向 + 文字</option>
          </select>
        </div>
      </div>
    `

    this.panel = this.element.querySelector('.settings-panel')!

    // Toggle button
    this.element.querySelector('.settings-toggle')!.addEventListener('click', () => {
      this.toggle()
    })

    // Speed slider
    const speedInput = this.element.querySelector('.settings-speed') as HTMLInputElement
    const speedValue = this.element.querySelector('.settings-speed-value')!
    speedInput.addEventListener('input', () => {
      this.settings.animationSpeed = parseInt(speedInput.value)
      speedValue.textContent = `${speedInput.value}ms`
    })

    // Hint level
    const hintLevel = this.element.querySelector('.settings-hint-level') as HTMLSelectElement
    hintLevel.addEventListener('change', () => {
      this.settings.hintLevel = parseInt(hintLevel.value) as 1 | 2 | 3
    })
  }

  public toggle(): void {
    this.isOpen = !this.isOpen
    this.panel.classList.toggle('open', this.isOpen)
  }

  public getSettings(): SettingsData {
    return { ...this.settings }
  }
}
