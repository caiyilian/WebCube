export interface Settings {
  animationSpeed: number
  showHints: boolean
  hintLevel: 1 | 2 | 3
}

export class SettingsPanel {
  private container: HTMLDivElement
  private panel: HTMLDivElement
  private isOpen: boolean = false
  private settings: Settings = {
    animationSpeed: 200,
    showHints: true,
    hintLevel: 2
  }
  private onSettingsChangeCallback: ((settings: Settings) => void) | null = null

  constructor() {
    this.container = document.createElement('div')
    this.container.style.position = 'absolute'
    this.container.style.top = '20px'
    this.container.style.right = '20px'
    this.container.style.zIndex = '100'

    // 设置按钮
    const settingsButton = document.createElement('button')
    settingsButton.textContent = '⚙️'
    settingsButton.style.padding = '10px 15px'
    settingsButton.style.cursor = 'pointer'
    settingsButton.style.fontSize = '18px'
    settingsButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    settingsButton.style.color = 'white'
    settingsButton.style.border = 'none'
    settingsButton.style.borderRadius = '4px'
    settingsButton.onclick = () => this.togglePanel()
    this.container.appendChild(settingsButton)

    // 设置面板
    this.panel = document.createElement('div')
    this.panel.style.position = 'absolute'
    this.panel.style.top = '50px'
    this.panel.style.right = '0'
    this.panel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
    this.panel.style.padding = '20px'
    this.panel.style.borderRadius = '8px'
    this.panel.style.color = 'white'
    this.panel.style.fontFamily = 'sans-serif'
    this.panel.style.minWidth = '200px'
    this.panel.style.display = 'none'
    this.container.appendChild(this.panel)

    this.createSettingsUI()
  }

  private createSettingsUI(): void {
    // 动画速度
    const speedLabel = document.createElement('div')
    speedLabel.textContent = '动画速度 (ms)'
    speedLabel.style.marginBottom = '5px'
    speedLabel.style.fontSize = '12px'
    speedLabel.style.color = '#aaa'
    this.panel.appendChild(speedLabel)

    const speedInput = document.createElement('input')
    speedInput.type = 'range'
    speedInput.min = '50'
    speedInput.max = '500'
    speedInput.value = this.settings.animationSpeed.toString()
    speedInput.style.width = '100%'
    speedInput.style.marginBottom = '10px'
    speedInput.onchange = (e) => {
      this.settings.animationSpeed = parseInt((e.target as HTMLInputElement).value)
      this.notifySettingsChange()
    }
    this.panel.appendChild(speedInput)

    // 显示提示
    const hintLabel = document.createElement('div')
    hintLabel.textContent = '显示提示'
    hintLabel.style.marginBottom = '5px'
    hintLabel.style.fontSize = '12px'
    hintLabel.style.color = '#aaa'
    this.panel.appendChild(hintLabel)

    const hintCheckbox = document.createElement('input')
    hintCheckbox.type = 'checkbox'
    hintCheckbox.checked = this.settings.showHints
    hintCheckbox.style.marginBottom = '10px'
    hintCheckbox.onchange = (e) => {
      this.settings.showHints = (e.target as HTMLInputElement).checked
      this.notifySettingsChange()
    }
    this.panel.appendChild(hintCheckbox)

    // 提示级别
    const levelLabel = document.createElement('div')
    levelLabel.textContent = '提示级别'
    levelLabel.style.marginBottom = '5px'
    levelLabel.style.fontSize = '12px'
    levelLabel.style.color = '#aaa'
    this.panel.appendChild(levelLabel)

    const levelSelect = document.createElement('select')
    levelSelect.style.width = '100%'
    levelSelect.style.marginBottom = '10px'
    levelSelect.value = this.settings.hintLevel.toString()
    levelSelect.onchange = (e) => {
      this.settings.hintLevel = parseInt((e.target as HTMLSelectElement).value) as 1 | 2 | 3
      this.notifySettingsChange()
    }

    const level1 = document.createElement('option')
    level1.value = '1'
    level1.textContent = 'Level 1 - 仅层'
    levelSelect.appendChild(level1)

    const level2 = document.createElement('option')
    level2.value = '2'
    level2.textContent = 'Level 2 - 层 + 方向'
    levelSelect.appendChild(level2)

    const level3 = document.createElement('option')
    level3.value = '3'
    level3.textContent = 'Level 3 - 层 + 方向 + 文字'
    levelSelect.appendChild(level3)

    this.panel.appendChild(levelSelect)
  }

  public getContainer(): HTMLDivElement {
    return this.container
  }

  public togglePanel(): void {
    this.isOpen = !this.isOpen
    this.panel.style.display = this.isOpen ? 'block' : 'none'
  }

  public onSettingsChange(callback: (settings: Settings) => void): void {
    this.onSettingsChangeCallback = callback
  }

  private notifySettingsChange(): void {
    if (this.onSettingsChangeCallback) {
      this.onSettingsChangeCallback({ ...this.settings })
    }
  }

  public getSettings(): Settings {
    return { ...this.settings }
  }
}
