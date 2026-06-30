/**
 * Electron preload script — Phase 7.2 / 7.4
 *
 * Exposes a secure IPC bridge via contextBridge.
 * Renderer accesses it through `window.electronAPI`.
 */

import { contextBridge, ipcRenderer, webUtils } from 'electron'

export interface ElectronAPI {
  // ── Properties (static, injected at preload time) ─────────
  platform: string
  version: string
  isDev: boolean

  // ── IPC invoke methods (renderer → main) ──────────────────
  getAppInfo: () => Promise<{ version: string; platform: string; isDev: boolean }>
  showOpenDialog: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
  showSaveDialog: (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
  getTheme: () => Promise<'light' | 'dark'>

  // ── Desktop settings (Phase 7.4) ─────────────────────────
  getDesktopSettings: () => Promise<{ backendMode: 'embedded' | 'external'; externalServerUrl: string }>
  setDesktopSettings: (settings: { backendMode?: 'embedded' | 'external'; externalServerUrl?: string }) => Promise<{ backendMode: 'embedded' | 'external'; externalServerUrl: string }>
  getServerUrl: () => Promise<string>

  // ── IPC event listeners (main → renderer) ─────────────────
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => () => void

  // ── Utility ───────────────────────────────────────────────
  getPathForFile: (file: File) => string
}

const api: ElectronAPI = {
  // Static properties
  platform: process.platform,
  version: process.env.npm_package_version ?? '1.0.0',
  isDev: Boolean(process.env.VITE_DEV_SERVER_URL),

  // IPC invoke methods
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  getTheme: () => ipcRenderer.invoke('get-theme'),

  // Desktop settings (Phase 7.4)
  getDesktopSettings: () => ipcRenderer.invoke('get-desktop-settings'),
  setDesktopSettings: (settings) => ipcRenderer.invoke('set-desktop-settings', settings),
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),

  // IPC event listeners
  onThemeChanged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: 'light' | 'dark') => callback(theme)
    ipcRenderer.on('theme-changed', handler)
    return () => ipcRenderer.removeListener('theme-changed', handler)
  },

  // Utility
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
}

contextBridge.exposeInMainWorld('electronAPI', api)
