import { Canvas } from './components/Canvas'
import { HUD } from './components/HUD'
import { Settings } from './components/Settings'
import { useGameStore, CubeSize } from './stores/useGameStore'
import { createHomePage, GameMode } from './components/HomePage.js'

export function createApp() {
  const root = document.getElementById('root')
  if (!root) return

  // Show home page initially
  showHomePage(root)
}

function showHomePage(root: HTMLElement) {
  root.innerHTML = ''
  const homePage = createHomePage()
  root.appendChild(homePage.element)

  // Handle mode selection
  homePage.onModeSelect = (mode: GameMode, cubeSize: CubeSize) => {
    initializeGame(mode, cubeSize, root)
  }

  // Listen for hash changes
  const handleHashChange = () => {
    const hash = window.location.hash.replace('#', '')
    const [mode, sizeStr] = hash.split('-')
    const cubeSize = parseInt(sizeStr) as CubeSize || 3
    if ((mode === 'practice' || mode === 'battle' || mode === 'coop') && (cubeSize === 2 || cubeSize === 3 || cubeSize === 4)) {
      initializeGame(mode as GameMode, cubeSize, root)
    } else {
      showHomePage(root)
    }
  }

  window.addEventListener('hashchange', handleHashChange)

  // Check initial hash
  const initialHash = window.location.hash.replace('#', '')
  const [mode, sizeStr] = initialHash.split('-')
  const cubeSize = parseInt(sizeStr) as CubeSize || 3
  if ((mode === 'practice' || mode === 'battle' || mode === 'coop') && (cubeSize === 2 || cubeSize === 3 || cubeSize === 4)) {
    initializeGame(mode as GameMode, cubeSize, root)
  }
}

function initializeGame(mode: GameMode, cubeSize: CubeSize, root: HTMLElement) {
  root.innerHTML = ''

  // Initialize Three.js canvas
  const canvas = new Canvas(cubeSize)
  root.appendChild(canvas.domElement)

  // Initialize HUD with mode
  const hud = new HUD(mode)
  root.appendChild(hud.element)

  // Initialize Settings panel
  const settings = new Settings()
  root.appendChild(settings.element)

  // Set cube size in store
  useGameStore.setCubeSize(cubeSize)

  // Connect HUD to store
  connectHUD(hud, settings, mode)

  // Start render loop
  canvas.animate()

  // Handle resize
  window.addEventListener('resize', () => canvas.onResize())

  // Expose for debugging
  ;(window as any).__WEBCUBE__ = { canvas, hud, settings, store: useGameStore }

  console.log(`WebCube initialized in ${mode} mode with ${cubeSize}x${cubeSize}x${cubeSize} cube`)
}

function connectHUD(hud: HUD, settings: Settings, mode: GameMode): void {
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
      useGameStore.scramble(20)
    },
    onReset: () => {
      useGameStore.resetCube()
      ;(window as any).__WEBCUBE__?.canvas?.cubeRenderer?.reset()
    },
    onSolve: () => {
      useGameStore.autoSolve()
    },
    onHint: () => {
      const store = useGameStore
      // Hint only available in practice mode
      if (mode !== 'practice') return
      if (store.getState().currentHint) {
        store.clearHint()
        hud.setHintActive(false)
      } else {
        store.requestHint().then(() => {
          hud.setHintActive(true)
        })
      }
    },
    onUndo: () => {
      useGameStore.undo()
    },
    onRedo: () => {
      useGameStore.redo()
    },
    onSettingsToggle: () => {
      settings.toggle()
    },
  })
}
