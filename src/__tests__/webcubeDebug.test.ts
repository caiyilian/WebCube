import { afterEach, describe, expect, it } from 'vitest'
import {
  exposeWebCubeDebugState,
  getWebCubeDebugState,
  type WebCubeDebugState,
} from '../debug/webcubeDebug'

const debugState = {
  canvas: { resetCube: () => undefined },
  hud: { setMoveCount: () => undefined },
  settings: { toggle: () => undefined },
  store: { getState: () => ({}) },
} as unknown as WebCubeDebugState

describe('webcubeDebug', () => {
  afterEach(() => {
    delete window.__WEBCUBE__
  })

  it('exposes the debug state when enabled', () => {
    exposeWebCubeDebugState(debugState, true)

    expect(getWebCubeDebugState()).toBe(debugState)
    expect(window.__WEBCUBE__?.canvas).toBe(debugState.canvas)
    expect(window.__WEBCUBE__?.hud).toBe(debugState.hud)
    expect(window.__WEBCUBE__?.settings).toBe(debugState.settings)
    expect(window.__WEBCUBE__?.store).toBe(debugState.store)
  })

  it('does not expose the debug state when disabled', () => {
    exposeWebCubeDebugState(debugState, false)

    expect(getWebCubeDebugState()).toBeUndefined()
  })
})
