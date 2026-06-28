import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CubeRenderer, CubeSize } from '../game/CubeRenderer.js'
import { Interaction } from '../game/Interaction.js'
import { useGameStore } from '../stores/useGameStore.js'
import { Move } from '@shared/types.js'

export class Canvas {
  public domElement: HTMLCanvasElement
  public renderer: THREE.WebGLRenderer
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public controls: OrbitControls
  private animationId: number | null = null

  // Game components
  private cubeRenderer: CubeRenderer
  private interaction: Interaction
  private unsubscribeStore: (() => void) | null = null

  constructor(cubeSize: CubeSize = 3) {
    // Create canvas
    this.domElement = document.createElement('canvas')
    this.domElement.style.width = '100%'
    this.domElement.style.height = '100%'
    this.domElement.style.display = 'block'

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.domElement,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x111111)

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(5, 5, 5)
    this.camera.lookAt(0, 0, 0)

    // Controls
    this.controls = new OrbitControls(this.camera, this.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.enablePan = false
    this.controls.minDistance = 3
    this.controls.maxDistance = 15
    this.controls.autoRotate = false

    // Lights
    this.setupLights()

    // Initialize game components
    this.cubeRenderer = new CubeRenderer(cubeSize)
    this.scene.add(this.cubeRenderer.getGroup())

    // Ground plane for shadows
    this.addGroundPlane()

    // Initialize interaction
    this.interaction = new Interaction(
      this.cubeRenderer,
      this.camera,
      this.domElement,
      this.onMove.bind(this)
    )

    // Subscribe to store changes
    this.subscribeToStore()
  }

  public setCubeSize(size: CubeSize): void {
    this.cubeRenderer.setCubeSize(size)
  }

  private setupLights(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0)
    mainLight.position.set(5, 10, 7)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -10
    mainLight.shadow.camera.right = 10
    mainLight.shadow.camera.top = 10
    mainLight.shadow.camera.bottom = -10
    mainLight.shadow.bias = -0.0005
    this.scene.add(mainLight)

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 5, -5)
    this.scene.add(fillLight)

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2)
    rimLight.position.set(0, -5, 0)
    this.scene.add(rimLight)
  }

  private addGroundPlane(): void {
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0,
      roughness: 1,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.5
    ground.receiveShadow = true
    this.scene.add(ground)
  }

  private subscribeToStore(): void {
    this.unsubscribeStore = useGameStore.subscribe((state) => {
      // Update animation duration
      this.cubeRenderer.setAnimationDuration(state.animationDuration)
      
      // Update hint highlight
      if (state.currentHint) {
        this.highlightHintLayer(state.currentHint.layer)
      } else {
        this.clearHintHighlight()
      }
    })
  }

  private highlightHintLayer(layer: string): void {
    const axisMap: Record<string, 'x' | 'y' | 'z'> = {
      R: 'x', L: 'x',
      U: 'y', D: 'y',
      F: 'z', B: 'z',
    }
    const layerMap: Record<string, number> = {
      R: 1, L: -1,
      U: 1, D: -1,
      F: 1, B: -1,
    }
    
    const axis = axisMap[layer]
    const layerIndex = layerMap[layer]
    if (axis && layerIndex !== undefined) {
      this.cubeRenderer.highlightLayer(axis, layerIndex, true)
    }
  }

  private clearHintHighlight(): void {
    this.cubeRenderer.highlightLayer('x', 1, false)
    this.cubeRenderer.highlightLayer('x', -1, false)
    this.cubeRenderer.highlightLayer('y', 1, false)
    this.cubeRenderer.highlightLayer('y', -1, false)
    this.cubeRenderer.highlightLayer('z', 1, false)
    this.cubeRenderer.highlightLayer('z', -1, false)
  }

  private async onMove(move: Move): Promise<void> {
    const axisMap: Record<string, 'x' | 'y' | 'z'> = {
      R: 'x', L: 'x',
      U: 'y', D: 'y',
      F: 'z', B: 'z',
    }
    const layerMap: Record<string, number> = {
      R: 1, L: -1,
      U: 1, D: -1,
      F: 1, B: -1,
    }

    const axis = move.axis ?? axisMap[move.face]
    const layer = move.layer ?? layerMap[move.face]
    if (axis && layer !== undefined) {
      if (layer !== 0) {
        useGameStore.applyMove(move)
      }

      const renderDirection = (layer >= 0 ? -move.direction : move.direction) as 1 | -1
      await this.cubeRenderer.rotateLayer(axis, layer, renderDirection)
    }
  }

  public animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate())

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  public onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.interaction.dispose()
    if (this.unsubscribeStore) {
      this.unsubscribeStore()
    }
    this.cubeRenderer.dispose()
    this.renderer.dispose()
    this.controls.dispose()
    this.scene.clear()
  }
}
