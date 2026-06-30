/**
 * Type declarations for Electron's window.electronAPI
 *
 * This file is included in tsconfig via src/types/ so the renderer
 * can access electronAPI methods with full type safety.
 */

export interface ElectronAPI {
  /** Platform string (win32, darwin, linux) */
  platform: string
  /** App version from package.json */
  version: string
  /** Whether running in development mode */
  isDev: boolean

  /** Get full app info from main process */
  getAppInfo: () => Promise<{ version: string; platform: string; isDev: boolean }>
  /** Open a native file-open dialog */
  showOpenDialog: (options?: OpenDialogOptions) => Promise<OpenDialogReturnValue>
  /** Open a native file-save dialog */
  showSaveDialog: (options?: SaveDialogOptions) => Promise<SaveDialogReturnValue>
  /** Get current OS theme (light/dark) */
  getTheme: () => Promise<'light' | 'dark'>

  /** Desktop settings (Phase 7.4) */
  getDesktopSettings: () => Promise<DesktopSettings>
  setDesktopSettings: (settings: Partial<DesktopSettings>) => Promise<DesktopSettings>
  /** Get the active server URL (embedded or external) */
  getServerUrl: () => Promise<string>

  /** Subscribe to OS theme changes; returns unsubscribe function */
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => () => void

  /** Electron utility: convert a File/Blob to its filesystem path */
  getPathForFile: (file: File) => string
}

// ── Desktop settings ──────────────────────────────────────────

export interface DesktopSettings {
  backendMode: 'embedded' | 'external'
  externalServerUrl: string
}

// ── Electron dialog types ─────────────────────────────────────

interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  /** @default ['openFile'] */
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>
  filters?: Array<{ name: string; extensions: string[] }>
}

interface SaveDialogOptions {
  title?: string
  defaultPath?: string
  filters?: Array<{ name: string; extensions: string[] }>
}

interface OpenDialogReturnValue {
  canceled: boolean
  filePaths: string[]
}

interface SaveDialogReturnValue {
  canceled: boolean
  filePath?: string
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
