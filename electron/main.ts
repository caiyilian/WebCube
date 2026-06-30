/**
 * Electron main process — Phase 7.1 / 7.2 / 7.4 / 7.5
 *
 * - Creates BrowserWindow for WebCube
 * - Dev mode: loads Vite dev server (http://localhost:5173)
 * - Production mode: loads built dist/index.html
 * - Window: 1600×1000 default, 800×600 minimum
 * - IPC handlers for renderer communication
 * - Embedded backend server (Phase 7.4)
 * - Tray icon, global shortcuts, exit confirmation (Phase 7.5)
 * - Window state persistence (Phase 7.5)
 */

import { app, BrowserWindow, shell, ipcMain, dialog, Menu, nativeTheme, Tray, globalShortcut, nativeImage, type MenuItemConstructorOptions } from 'electron'
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

// ── Persistent state helpers ──────────────────────────────────

/** Path to per-user settings file (Phase 7.4) */
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

/** Path to window-state file (Phase 7.5) */
function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json')
}

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  maximized: boolean
}

const defaultWindowState: WindowState = {
  width: 1600,
  height: 1000,
  maximized: false,
}

function loadWindowState(): WindowState {
  try {
    const data = fs.readFileSync(getWindowStatePath(), 'utf-8')
    return { ...defaultWindowState, ...JSON.parse(data) }
  } catch {
    return { ...defaultWindowState }
  }
}

function saveWindowState(win: BrowserWindow): void {
  const maximized = win.isMaximized()
  const bounds = win.getBounds()
  const state: WindowState = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized,
  }
  fs.writeFileSync(getWindowStatePath(), JSON.stringify(state, null, 2), 'utf-8')
}

// ── Tray ──────────────────────────────────────────────────────

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null

function createTray(): void {
  // Use the app icon for the tray
  const iconPath = path.join(__dirname, '..', 'icons', 'icon.png')
  let trayIcon: Electron.NativeImage
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  } else {
    // Fallback: create a 16x16 transparent icon
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('WebCube')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏窗口',
      click: () => toggleWindow(),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  // Double-click tray icon to toggle window (Windows behaviour)
  tray.on('double-click', () => toggleWindow())
}

function toggleWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

// ── Global shortcuts ──────────────────────────────────────────

function registerGlobalShortcuts(): void {
  // Ctrl+Shift+W / Cmd+Shift+W: toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+W', () => {
    toggleWindow()
  })

  // Ctrl+Shift+R / Cmd+Shift+R: force reload (clear cache)
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    if (mainWindow) {
      mainWindow.webContents.reloadIgnoringCache()
    }
  })
}

// ── IPC Handlers ──────────────────────────────────────────────

function registerIpcHandlers(): void {
  ipcMain.handle('get-app-info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    isDev,
  }))

  ipcMain.handle('show-open-dialog', async (_event, options: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(options)
    return result
  })

  ipcMain.handle('show-save-dialog', async (_event, options: Electron.SaveDialogOptions) => {
    const result = await dialog.showSaveDialog(options)
    return result
  })

  ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light')

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

// ── Application Menu (Phase 7.5: added 窗口 & 帮助) ──────────

function buildAppMenu(): void {
  const template: MenuItemConstructorOptions[] = [
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
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' },
        { type: 'separator' },
        {
          label: '切换显示',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => toggleWindow(),
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 WebCube',
          click: () => {
            if (mainWindow) {
              void dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '关于 WebCube',
                message: `WebCube v${app.getVersion()}`,
                detail: '网页版魔方游戏\n支持多人联机、协作解魔方、AI 智能提示\n\n基于 Three.js + Socket.IO 构建',
              })
            }
          },
        },
        { type: 'separator' },
        { role: 'toggleDevTools', label: '开发者工具' },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ── Window ────────────────────────────────────────────────────

function createWindow(): BrowserWindow {
  const savedState = loadWindowState()

  const win = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
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

  // Restore saved position (if outside any display, let Electron place it)
  if (savedState.x !== undefined && savedState.y !== undefined) {
    win.setPosition(savedState.x, savedState.y)
  }

  // Restore maximized state
  if (savedState.maximized) {
    win.maximize()
  }

  // Show window when ready to avoid flash
  win.once('ready-to-show', () => {
    win.show()
  })

  // Save window state on resize/move (debounced via 'close' save)
  win.on('close', (event) => {
    // Exit confirmation (production only)
    if (!isDev && !app.isQuitting) {
      event.preventDefault()
      const result = dialog.showMessageBoxSync(win, {
        type: 'question',
        buttons: ['最小化到托盘', '退出程序', '取消'],
        defaultId: 0,
        cancelId: 2,
        title: '退出确认',
        message: 'WebCube 正在后台运行',
        detail: '选择「最小化到托盘」可将应用隐藏到系统托盘继续运行。',
      })
      if (result === 0) {
        // Minimize to tray
        win.hide()
      } else if (result === 1) {
        // Quit
        saveWindowState(win)
        app.isQuitting = true
        app.quit()
      }
      // result === 2: cancel, do nothing
      return
    }

    // In dev or when isQuitting, save state and proceed
    saveWindowState(win)
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

  mainWindow = win
  return win
}

// ── App Lifecycle ─────────────────────────────────────────────

app.whenReady().then(async () => {
  registerIpcHandlers()
  buildAppMenu()

  // Start embedded server
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
  createTray()
  registerGlobalShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow) {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', () => {
  // On macOS, keep the app in the dock even when all windows are closed
  if (process.platform !== 'darwin') {
    // Don't quit — minimize to tray instead
    // Actual quit only happens via tray menu or exit button
  }
})

app.on('before-quit', () => {
  embeddedServer.stop()
  globalShortcut.unregisterAll()
  if (tray) {
    tray.destroy()
    tray = null
  }
})

// Declare isQuitting on app for the close handler
declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}
