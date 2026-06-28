import { Canvas } from './components/Canvas'
import { HUD } from './components/HUD'
import { useGameStore } from './stores/useGameStore'

export function createApp() {
  const root = document.getElementById('root')
  if (!root) return

  // Initialize Three.js canvas
  const canvas = new Canvas()
  root.appendChild(canvas.domElement)

  // Initialize HUD
  const hud = new HUD()
  root.appendChild(hud.element)

  // Connect HUD to store
  connectHUD(hud)

  // Start render loop
  canvas.animate()

  // Handle resize
  window.addEventListener('resize', () => canvas.onResize())

  // Expose for debugging
  ;(window as any).__WEBCUBE__ = { canvas, hud, store: useGameStore }

  console.log('WebCube initialized')
}

function connectHUD(hud: HUD): void {
  // Subscribe to store changes
  useGameStore.subscribe((state) => {
    // Update timer display
    if (state.isTimerRunning && state.timerStartTime) {
      const elapsed = state.timerElapsed + (Date.now() - state.timerStartTime)
      const seconds = (elapsed / 1000).toFixed(3)
      hud.timerElement.textContent = seconds
    } else if (!state.isTimerRunning) {
      const seconds = (state.timerElapsed / 1000).toFixed(3)
      hud.timerElement.textContent = seconds
    }

    // Update move count
    hud.setMoveCount(state.moveHistory.length)
  })

  // Connect HUD callbacks
  hud.onScramble = () => {
    useGameStore.getState().scramble(20)
  }

  hud.onReset = () => {
    useGameStore.getState().resetCube()
    // Reset cube renderer
    ;(window as any).__WEBCUBE__?.canvas?.cubeRenderer?.reset()
  }

  hud.onSolve = async () => {
    // TODO: Implement auto-solve
    console.log('Auto-solve requested')
  }

  hud.onHint = async () => {
    const store = useGameStore.getState()
    if (store.currentHint) {
      store.clearHint()
    } else {
      // TODO: Get hint from HintEngine
      console.log('Hint requested')
    }
  }

  hud.onUndo = () => {
    useGameStore.getState().undo()
  }

  hud.onRedo = () => {
    useGameStore.getState().redo()
  }
}