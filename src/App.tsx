import { Canvas } from './components/Canvas'
import { HUD } from './components/HUD'
import { Settings } from './components/Settings'
import { useGameStore, CubeSize } from './stores/useGameStore'
import { createHomePage } from './components/HomePage.js'
import { createRoomPage } from './components/RoomPage'
import { createCFOPTrainingPanel } from './components/CFOPTrainingPanel'
import { createReplayPanel } from './components/ReplayPanel'
import { createAIPanel } from './components/AIPanel'
import { soundManager } from './game/SoundManager'
import { exposeWebCubeDebugState } from './debug/webcubeDebug'
import type { GameMode } from '../shared/types'

interface GameRoute {
  mode: GameMode
  cubeSize: CubeSize
}

export function normalizeGameRoute(hash: string): GameRoute | null {
  const normalizedHash = hash.replace('#', '')
  const [rawMode, sizeStr] = normalizedHash.split('-')
  const mode = rawMode === 'battle' ? '1v1' : rawMode
  const cubeSize = (parseInt(sizeStr) || 3) as CubeSize

  if (
    (mode === 'practice' || mode === '1v1' || mode === 'coop') &&
    (cubeSize === 2 || cubeSize === 3 || cubeSize === 4)
  ) {
    return { mode, cubeSize }
  }

  if (mode === 'cfop' && cubeSize === 3) {
    return { mode, cubeSize }
  }

  return null
}

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
    showRoute({ mode, cubeSize }, root)
  }

  // Listen for hash changes
  const handleHashChange = () => {
    const route = normalizeGameRoute(window.location.hash)
    if (route) {
      showRoute(route, root)
    } else {
      showHomePage(root)
    }
  }

  window.addEventListener('hashchange', handleHashChange)

  // Check initial hash
  const route = normalizeGameRoute(window.location.hash)
  if (route) {
    showRoute(route, root)
  }
}

function showRoute(route: GameRoute, root: HTMLElement): void {
  if (route.mode === 'practice' || route.mode === 'cfop') {
    initializeGame(route.mode, route.cubeSize, root)
    return
  }

  root.innerHTML = ''
  const roomPage = createRoomPage({
    mode: route.mode,
    cubeSize: route.cubeSize,
    onBack: () => {
      roomPage.destroy()
      window.location.hash = ''
      showHomePage(root)
    },
  })
  root.appendChild(roomPage.element)
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

  const cfopPanel = mode === 'cfop' ? createCFOPTrainingPanel() : null
  if (cfopPanel) root.appendChild(cfopPanel.element)

  const replayPanel = createReplayPanel({
    onResetView: () => canvas.resetCube(),
    onReplayMove: (move) => canvas.animateMove(move),
  })
  root.appendChild(replayPanel.element)

  if (mode === 'practice') {
    const aiPanel = createAIPanel()
    root.appendChild(aiPanel.element)
  }

  // Set cube size in store
  useGameStore.setCubeSize(cubeSize)

  // Connect HUD to store
  connectHUD(hud, settings, mode, canvas)

  // Start render loop
  canvas.animate()

  // Handle resize
  window.addEventListener('resize', () => canvas.onResize())

  exposeWebCubeDebugState({ canvas, hud, settings, store: useGameStore })

  console.log(`WebCube initialized in ${mode} mode with ${cubeSize}x${cubeSize}x${cubeSize} cube`)
}

function connectHUD(hud: HUD, settings: Settings, mode: GameMode, canvas: Canvas): void {
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

    // Update visible move count based on the current undo/redo cursor.
    hud.setMoveCount(Math.max(0, state.moveHistoryIndex + 1))
    hud.setSolving(state.isSolving)
    hud.setHint(state.currentHint, state.hintLevel)
  })

  if (mode !== 'practice') {
    hud.hideHintButton()
  }

  // Connect HUD callbacks
  hud.setCallbacks({
    onScramble: () => {
      soundManager.play('scramble')
      useGameStore.scramble(20)
    },
    onReset: () => {
      soundManager.play('click')
      useGameStore.resetCube()
      canvas.resetCube()
    },
    onSolve: () => {
      soundManager.play('click')
      void useGameStore.autoSolve((move) => canvas.animateMove(move)).then(() => {
        if (useGameStore.getState().isSolved) soundManager.play('solve')
      })
    },
    onHint: () => {
      soundManager.play('click')
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
      soundManager.play('move')
      useGameStore.undo()
    },
    onRedo: () => {
      soundManager.play('move')
      useGameStore.redo()
    },
    onSettingsToggle: () => {
      soundManager.play('click')
      settings.toggle()
    },
  })
}
