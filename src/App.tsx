import { Canvas } from './components/Canvas'
import { HUD } from './components/HUD'
import { Settings } from './components/Settings'
import { useGameStore } from './stores/useGameStore'
import { createHomePage } from './components/HomePage.js'

export type GameMode = 'practice' | 'battle' | 'coop'

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
  homePage.onModeSelect = (mode: GameMode) => {
    initializeGame(mode, root)
  }

  // Listen for hash changes
  const handleHashChange = () => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'practice' || hash === 'battle' || hash === 'coop') {
      initializeGame(hash as GameMode, root)
    } else {
      showHomePage(root)
    }
  }

  window.addEventListener('hashchange', handleHashChange)

  // Check initial hash
  const initialHash = window.location.hash.replace('#', '')
  if (initialHash === 'practice' || initialHash === 'battle' || initialHash === 'coop') {
    initializeGame(initialHash as GameMode, root)
  }
}

function initializeGame(mode: GameMode, root: HTMLElement) {
  root.innerHTML = ''

  // Initialize Three.js canvas
  const canvas = new Canvas()
  root.appendChild(canvas.domElement)

  // Initialize HUD with mode
  const hud = new HUD(mode)
  root.appendChild(hud.element)

  // Initialize Settings panel
  const settings = new Settings()
  root.appendChild(settings.element)

  // Connect HUD to store
  connectHUD(hud, settings, mode)

  // Start render loop
  canvas.animate()

  // Handle resize
  window.addEventListener('resize', () => canvas.onResize())

  // Expose for debugging
  ;(window as any).__WEBCUBE__ = { canvas, hud, settings, store: useGameStore }

  console.log(`WebCube initialized in ${mode} mode`)
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
