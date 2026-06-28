export type ThemeName = 'classic' | 'neon' | 'soft'

export interface Theme {
  name: ThemeName
  label: string
  colors: {
    background: string
    surface: string
    text: string
    accent: string
    timer: string
    button: string
    buttonHover: string
  }
}

export const themes: Record<ThemeName, Theme> = {
  classic: {
    name: 'classic',
    label: '经典',
    colors: {
      background: '#111111',
      surface: 'rgba(0, 0, 0, 0.7)',
      text: '#ffffff',
      accent: '#4da6ff',
      timer: '#ffffff',
      button: 'rgba(255, 255, 255, 0.1)',
      buttonHover: 'rgba(255, 255, 255, 0.2)',
    },
  },
  neon: {
    name: 'neon',
    label: '霓虹',
    colors: {
      background: '#0a0a1a',
      surface: 'rgba(20, 20, 40, 0.8)',
      text: '#00ffcc',
      accent: '#ff00ff',
      timer: '#00ffcc',
      button: 'rgba(0, 255, 204, 0.15)',
      buttonHover: 'rgba(0, 255, 204, 0.3)',
    },
  },
  soft: {
    name: 'soft',
    label: '柔和',
    colors: {
      background: '#f5f5f5',
      surface: 'rgba(255, 255, 255, 0.9)',
      text: '#333333',
      accent: '#6b9eff',
      timer: '#333333',
      button: 'rgba(0, 0, 0, 0.05)',
      buttonHover: 'rgba(0, 0, 0, 0.1)',
    },
  },
}

export class ThemeManager {
  private currentTheme: ThemeName = 'classic'
  private storageKey = 'webcube-theme'

  constructor() {
    this.loadTheme()
  }

  setTheme(name: ThemeName): void {
    this.currentTheme = name
    this.applyTheme()
    localStorage.setItem(this.storageKey, name)
  }

  getCurrentTheme(): Theme {
    return themes[this.currentTheme]
  }

  getCurrentThemeName(): ThemeName {
    return this.currentTheme
  }

  private loadTheme(): void {
    const saved = localStorage.getItem(this.storageKey) as ThemeName | null
    if (saved && themes[saved]) {
      this.currentTheme = saved
    }
    this.applyTheme()
  }

  private applyTheme(): void {
    const theme = this.getCurrentTheme()
    const root = document.documentElement

    root.style.setProperty('--bg-color', theme.colors.background)
    root.style.setProperty('--surface-color', theme.colors.surface)
    root.style.setProperty('--text-color', theme.colors.text)
    root.style.setProperty('--accent-color', theme.colors.accent)
    root.style.setProperty('--timer-color', theme.colors.timer)
    root.style.setProperty('--button-color', theme.colors.button)
    root.style.setProperty('--button-hover-color', theme.colors.buttonHover)

    // Update body background
    document.body.style.background = theme.colors.background
    document.body.style.color = theme.colors.text
  }
}

export const themeManager = new ThemeManager()
