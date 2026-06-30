/**
 * Electron main process — Phase 7.1 / 7.2 / 7.4
 *
 * - Creates BrowserWindow for WebCube
 * - Dev mode: loads Vite dev server (http://localhost:5173)
 * - Production mode: loads built dist/index.html
 * - Window: 1600×1000 default, 800×600 minimum
 * - IPC handlers for renderer communication
 * - Embedded backend server (Phase 7.4)
 */

import { app, BrowserWindow, shell, ipcMain, dialog, Menu, nativeTheme } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createEmbeddedServer } from './server.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Whether we are running in Vite dev-server mode */
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? ''
const isDev = DEV_SERVER_URL.length > 0

/** Embedded server instance */
const embeddedServer = createEmbeddedServer()

/** Path to per-user settings file */
function getSettingsPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'settings.json')
}

interface DesktopSettings {
  backendMode: 'embedded' | 'external'
  externalServerUrl: string
}

const defaultSettings: DesktopSettings = {
  backendMode: 'embedded',
  externalServerUrl: '',
}

function loadSettings(): DesktopSettings {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8')
    return { ...defaultSettings, ...JSON.parse(data) }
  } catch {
    return { ...defaultSettings }
  }
}

function saveSettings(settings: DesktopSettings): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

// ── IPC Handlers ──────────────────────────────────────────────

function registerIpcHandlers(): void {
  // Return app info to the renderer
  ipcMain.handle('get-app-info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    isDev,
  }))

  // Open file dialog
  ipcMain.handle('show-open-dialog', async (_event, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(options)
    return result
  })

  // Save file dialog
  ipcMain.handle('show-save-dialog', async (_event, options: Electron.SaveDialogOptions) => {
    const result = await dialog.showSaveDialog(options)
    return result
  })

  // Get current theme (light/dark)
  ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light')

  // Listen for theme changes
  nativeTheme.on('updated', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
    })
  })

  // ── Desktop settings (Phase 7.4) ──
  ipcMain.handle('get-desktop-settings', () => loadSettings())

  ipcMain.handle('set-desktop-settings', (_event, newSettings: DesktopSettings) => {
    const merged = { ...loadSettings(), ...newSettings }
    saveSettings(merged)
    return merged
  })

  ipcMain.handle('get-server-url', () => {
    const settings = loadSettings()
    if (settings.backendMode === 'external') {
      return settings.externalServerUrl || 'http://localhost:3000'
    }
    return embeddedServer.url
  })
}

// ── Application Menu ──────────────────────────────────────────

function buildAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'WebCube',
      submenu: [
        { role: 'about', label: '关于 WebCube' },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ── Window ────────────────────────────────────────────────────

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 800,
    minHeight: 600,
    title: 'WebCube',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Show window when ready to avoid flash
  win.once('ready-to-show', () => {
    win.show()
  })

  // Open external links in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (isDev) {
    void win.loadURL(DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    void win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  return win
}

// ── App Lifecycle ─────────────────────────────────────────────

app.whenReady().then(async () => {
  registerIpcHandlers()
  buildAppMenu()

  // Start embedded server in production, or in dev when no external server is specified
  const settings = loadSettings()
  if (settings.backendMode === 'embedded') {
    try {
      await embeddedServer.start()
      console.log(`[main] Embedded server started at ${embeddedServer.url}`)
    } catch (err) {
      console.error('[main] Failed to start embedded server:', err)
    }
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  embeddedServer.stop()
})
