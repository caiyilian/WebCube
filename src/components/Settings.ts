import { soundManager } from '../game/SoundManager'
import { themeManager, themes, type ThemeName } from '../game/ThemeManager'
import type { DesktopSettings } from '../types/electron'

export interface SettingsData {
  animationSpeed: number
  hintLevel: 1 | 2 | 3
  theme: ThemeName
  soundEnabled: boolean
  volume: number
}

const defaultDesktopSettings: DesktopSettings = {
  backendMode: 'embedded',
  externalServerUrl: '',
}

export class Settings {
  public element: HTMLElement
  private panel: HTMLElement
  private isOpen = false
  private settings: SettingsData = {
    animationSpeed: 200,
    hintLevel: 2,
    theme: themeManager.getCurrentThemeName(),
    soundEnabled: soundManager.isEnabled(),
    volume: soundManager.getVolume(),
  }
  /** Whether running inside Electron (desktop app) */
  private isDesktop = false
  private desktopSettings: DesktopSettings = { ...defaultDesktopSettings }
  private desktopSettingsEl: HTMLElement | null = null

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
        <div class="settings-item">
          <label>主题</label>
          <select class="settings-theme">
            ${Object.values(themes).map((theme) => `
              <option value="${theme.name}" ${theme.name === this.settings.theme ? 'selected' : ''}>${theme.label}</option>
            `).join('')}
          </select>
        </div>
        <div class="settings-item settings-inline">
          <label>音效</label>
          <input type="checkbox" class="settings-sound-enabled" ${this.settings.soundEnabled ? 'checked' : ''}>
        </div>
        <div class="settings-item">
          <label>音量</label>
          <input type="range" class="settings-volume" min="0" max="1" value="${this.settings.volume}" step="0.05">
          <span class="settings-volume-value">${Math.round(this.settings.volume * 100)}%</span>
        </div>
        <!-- Desktop settings (Electron only) — hidden by default -->
        <div class="settings-desktop-section" hidden>
          <div class="settings-separator"></div>
          <div class="settings-title settings-subtitle">桌面设置</div>
          <div class="settings-item">
            <label>后端模式</label>
            <select class="settings-backend-mode">
              <option value="embedded">内嵌服务器</option>
              <option value="external">外部服务器</option>
            </select>
          </div>
          <div class="settings-item settings-external-url" hidden>
            <label>服务器地址</label>
            <input type="text" class="settings-external-url-input" placeholder="http://localhost:3000">
          </div>
        </div>
      </div>
    `

    this.panel = this.element.querySelector('.settings-panel')!
    this.desktopSettingsEl = this.element.querySelector('.settings-desktop-section') as HTMLElement

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

    const themeSelect = this.element.querySelector('.settings-theme') as HTMLSelectElement
    themeSelect.addEventListener('change', () => {
      this.settings.theme = themeSelect.value as ThemeName
      themeManager.setTheme(this.settings.theme)
      soundManager.play('click')
    })

    const soundEnabled = this.element.querySelector('.settings-sound-enabled') as HTMLInputElement
    soundEnabled.addEventListener('change', () => {
      this.settings.soundEnabled = soundEnabled.checked
      soundManager.setEnabled(this.settings.soundEnabled)
      soundManager.play('click')
    })

    const volumeInput = this.element.querySelector('.settings-volume') as HTMLInputElement
    const volumeValue = this.element.querySelector('.settings-volume-value')!
    volumeInput.addEventListener('input', () => {
      this.settings.volume = Number(volumeInput.value)
      volumeValue.textContent = `${Math.round(this.settings.volume * 100)}%`
      soundManager.setVolume(this.settings.volume)
    })

    // ── Desktop settings (Phase 7.4) ───────────────────────────
    this.isDesktop = typeof window !== 'undefined' && Boolean(window.electronAPI)

    if (this.isDesktop) {
      void this.initDesktopSettings()
    }
  }

  private async initDesktopSettings(): Promise<void> {
    if (!this.desktopSettingsEl || !window.electronAPI) return

    // Show the desktop section
    this.desktopSettingsEl.hidden = false

    // Load saved settings from main process
    try {
      this.desktopSettings = await window.electronAPI.getDesktopSettings()
    } catch {
      this.desktopSettings = { ...defaultDesktopSettings }
    }

    const modeSelect = this.desktopSettingsEl.querySelector('.settings-backend-mode') as HTMLSelectElement
    const externalUrlRow = this.desktopSettingsEl.querySelector('.settings-external-url') as HTMLElement
    const externalUrlInput = this.desktopSettingsEl.querySelector('.settings-external-url-input') as HTMLInputElement

    // Set current values
    modeSelect.value = this.desktopSettings.backendMode
    externalUrlInput.value = this.desktopSettings.externalServerUrl
    externalUrlRow.hidden = this.desktopSettings.backendMode !== 'external'

    modeSelect.addEventListener('change', () => {
      const newMode = modeSelect.value as 'embedded' | 'external'
      this.desktopSettings.backendMode = newMode
      externalUrlRow.hidden = newMode !== 'external'
      void this.saveDesktopSettings()
    })

    externalUrlInput.addEventListener('change', () => {
      this.desktopSettings.externalServerUrl = externalUrlInput.value
      void this.saveDesktopSettings()
    })
  }

  private async saveDesktopSettings(): Promise<void> {
    if (!window.electronAPI) return
    try {
      this.desktopSettings = await window.electronAPI.setDesktopSettings(this.desktopSettings)
    } catch {
      // ignore save failures
    }
  }

  public toggle(): void {
    this.isOpen = !this.isOpen
    this.panel.classList.toggle('open', this.isOpen)
  }

  public getSettings(): SettingsData {
    return { ...this.settings }
  }
}
