/**
 * Embedded server wrapper — Phase 7.4
 *
 * Starts the WebCube Express + Socket.IO server as a child process
 * using tsx, so the desktop app can run standalone without a
 * separate terminal for the backend.
 *
 * The server runs on port 3001 by default (different from manual
 * npm run server which uses 3000) to avoid port conflicts.
 */

import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_PORT = 3001

export interface EmbeddedServer {
  port: number
  url: string
  start: () => Promise<void>
  stop: () => void
}

export function createEmbeddedServer(port: number = DEFAULT_PORT): EmbeddedServer {
  let child: ChildProcess | null = null
  let started = false
  let startResolve: (() => void) | null = null

  const url = `http://localhost:${port}`

  const server: EmbeddedServer = {
    port,
    url,

    start: () => new Promise<void>((resolve, reject) => {
      if (started) {
        resolve()
        return
      }

      const serverEntry = path.resolve(__dirname, '..', 'server', 'index.ts')
      const env = {
        ...process.env,
        PORT: String(port),
        NODE_ENV: process.env.NODE_ENV ?? 'production',
      }

      child = spawn('npx.cmd', ['tsx', serverEntry], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: path.resolve(__dirname, '..'),
      })

      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString()
        // Resolve when server prints "Server running"
        if (!started && text.includes('Server running')) {
          started = true
          startResolve?.()
          startResolve = null
        }
      })

      child.stderr?.on('data', (data: Buffer) => {
        console.error('[server]', data.toString())
      })

      child.on('error', (err) => {
        if (!started) {
          reject(err)
        }
      })

      child.on('exit', (code) => {
        child = null
        started = false
        if (!started && startResolve) {
          reject(new Error(`Server exited with code ${code}`))
          startResolve = null
        }
      })

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!started) {
          reject(new Error('Server start timeout'))
        }
      }, 15_000)

      startResolve = resolve
    }),

    stop: () => {
      if (child) {
        child.kill('SIGTERM')
        child = null
      }
      started = false
    },
  }

  return server
}
