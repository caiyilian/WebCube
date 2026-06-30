/**
 * Electron preload script — Phase 7.1 / 7.2
 *
 * Exposes a minimal `electronAPI` bridge to the renderer process.
 * Expanded in Phase 7.2 with file dialogs, native menus, etc.
 */

import { contextBridge, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  /** Platform information */
  platform: process.platform,
  /** App version from package.json */
  version: process.env.npm_package_version ?? '1.0.0',
  /** Whether running in development mode */
  isDev: Boolean(process.env.VITE_DEV_SERVER_URL),
  /** Convert a File / Blob to its path (Electron-specific) */
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
})
