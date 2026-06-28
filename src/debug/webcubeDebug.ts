import type { Canvas } from '../components/Canvas'
import type { HUD } from '../components/HUD'
import type { Settings } from '../components/Settings'
import type { useGameStore } from '../stores/useGameStore'

export interface WebCubeDebugState {
  canvas: Canvas
  hud: HUD
  settings: Settings
  store: typeof useGameStore
}

declare global {
  interface Window {
    __WEBCUBE__?: WebCubeDebugState
  }
}

export function exposeWebCubeDebugState(state: WebCubeDebugState, enabled = import.meta.env.DEV): void {
  if (!enabled) return
  window.__WEBCUBE__ = state
}

export function getWebCubeDebugState(): WebCubeDebugState | undefined {
  return window.__WEBCUBE__
}
