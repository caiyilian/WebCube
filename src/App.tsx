import { Canvas } from './components/Canvas'
import { HUD } from './components/HUD'
import { Settings } from './components/Settings'
import { useGameStore } from './stores/useGameStore'

export function createApp() {
  const root = document.getElementById('root')
  if (!root) return

  // Initialize Three.js canvas
  const canvas = new Canvas()
  root.appendChild(canvas.domElement)

  // Initialize HUD
  const hud = new HUD('practice')
  root.appendChild(hud.element)

  // Initialize Settings panel
  const settings = new Settings()
  root.appendChild(settings.element)

  // Connect HUD to store
  connectHUD(hud, settings)

  // Start render loop
  canvas.animate()

  // Handle resize
  window.addEventListener('resize', () => canvas.onResize())

  // Expose for debugging
  ;(window as any).__WEBCUBE__ = { canvas, hud, settings, store: useGameStore }

  console.log('WebCube initialized')
}

function connectHUD(hud: HUD, settings: Settings): void {
  // Subscribe to store changes
  useGameStore.subscribe((state) => {
    // Update timer display
    if (state.isTimerRunning && state.timerStartTime) {
      const elapsed = state.timerElapsed + (Date.now() - state.timerStartTime)
      const seconds = (elapsed / 1000).toFixed(3)
      hud.setTimerDisplay(seconds)
    } else if (!state.isTimerRunning) {
      const seconds = (state.timerElapsed / 1000).toFixed(3)
      hud.setTimerDisplay(seconds)
    }

    // Update move count
    hud.setMoveCount(state.moveHistory.length)
  })

  // Connect HUD callbacks
  hud.setCallbacks({
    onScramble: () => {
      useGameStore.getState().scramble(20)
    },
    onReset: () => {
      useGameStore.getState().resetCube()
      ;(window as any).__WEBCUBE__?.canvas?.cubeRenderer?.reset()
    },
    onSolve: () => {
      useGameStore.getState().autoSolve()
    },
    onHint: () => {
      const store = useGameStore.getState()
      if (store.currentHint) {
        store.clearHint()
        hud.setHintActive(false)
      } else {
        store.requestHint().then(() => {
          hud.setHintActive(true)
        })
      }
    },
    onUndo: () => {
      useGameStore.getState().undo()
    },
    onRedo: () => {
      useGameStore.getState().redo()
    },
    onSettingsToggle: () => {
      settings.toggle()
    },
  })
}
