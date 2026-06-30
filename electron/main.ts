/**
 * Electron main process — Phase 7.1 / 7.2
 *
 * - Creates BrowserWindow for WebCube
 * - Dev mode: loads Vite dev server (http://localhost:5173)
 * - Production mode: loads built dist/index.html
 * - Window: 1600×1000 default, 800×600 minimum
 * - IPC handlers for renderer communication
 */

import { app, BrowserWindow, shell, ipcMain, dialog, Menu, nativeTheme } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Whether we are running in Vite dev-server mode */
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? ''
const isDev = DEV_SERVER_URL.length > 0

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

  // macOS needs the first menu to be the app menu
  if (process.platform === 'darwin') {
    // Electron handles the app menu automatically on macOS
  }

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

app.whenReady().then(() => {
  registerIpcHandlers()
  buildAppMenu()
  createWindow()

  // macOS: re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit on all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
