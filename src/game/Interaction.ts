import * as THREE from 'three'
import { CubeRenderer } from './CubeRenderer.js'
import { Move } from '@shared/types.js'

export class Interaction {
  private renderer: CubeRenderer
  private camera: THREE.Camera
  private domElement: HTMLElement
  private onMove: (move: Move) => void

  // Selection
  private selectedFace: 'R' | 'L' | 'U' | 'D' | 'F' | 'B' | null = null

  // Orbit tracking
  private isOrbiting = false
  private orbitStart = new THREE.Vector2()

  // Raycaster
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()

  constructor(
    renderer: CubeRenderer,
    camera: THREE.Camera,
    domElement: HTMLElement,
    onMove: (move: Move) => void
  ) {
    this.renderer = renderer
    this.camera = camera
    this.domElement = domElement
    this.onMove = onMove
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.domElement.addEventListener('mouseleave', this.onMouseUp.bind(this))
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false })
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false })
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this))
    window.addEventListener('keydown', this.onKeyDown.bind(this))
  }

  private onMouseDown(event: MouseEvent): void {
    this.orbitStart.set(event.clientX, event.clientY)
    this.isOrbiting = true
  }

  private onMouseMove(_event: MouseEvent): void {
    // Orbit handled by OrbitControls
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isOrbiting) return
    this.isOrbiting = false
    const dx = event.clientX - this.orbitStart.x
    const dy = event.clientY - this.orbitStart.y
    if (Math.hypot(dx, dy) < 5) {
      this.mouse.set(
        (event.clientX / this.domElement.clientWidth) * 2 - 1,
        -(event.clientY / this.domElement.clientHeight) * 2 + 1
      )
      this.trySelect()
    }
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return
    event.preventDefault()
    const touch = event.touches[0]
    this.orbitStart.set(touch.clientX, touch.clientY)
    this.isOrbiting = true
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isOrbiting || event.touches.length !== 1) return
    event.preventDefault()
  }

  private onTouchEnd(event: TouchEvent): void {
    if (!this.isOrbiting) return
    this.isOrbiting = false
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0]
      const dx = touch.clientX - this.orbitStart.x
      const dy = touch.clientY - this.orbitStart.y
      if (Math.hypot(dx, dy) < 10) {
        this.mouse.set(
          (touch.clientX / this.domElement.clientWidth) * 2 - 1,
          -(touch.clientY / this.domElement.clientHeight) * 2 + 1
        )
        this.trySelect()
      }
    }
  }

  private trySelect(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.renderer.getGroup().children, true)

    if (intersects.length === 0) {
      this.clearSelection()
      return
    }

    const hit = intersects[0]
    if (!hit.face || !(hit.object instanceof THREE.Mesh)) {
      this.clearSelection()
      return
    }

    // Determine the cube face from the hit face's world-space normal.
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    const absX = Math.abs(normal.x)
    const absY = Math.abs(normal.y)
    const absZ = Math.abs(normal.z)

    let face: 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
    if (absX >= absY && absX >= absZ) {
      face = normal.x > 0 ? 'R' : 'L'
    } else if (absY >= absX && absY >= absZ) {
      face = normal.y > 0 ? 'U' : 'D'
    } else {
      face = normal.z > 0 ? 'F' : 'B'
    }

    this.selectedFace = face
    this.renderer.selectMeshMaterial(hit.object, hit.face.materialIndex)
  }

  private clearSelection(): void {
    this.selectedFace = null
    this.renderer.clearSelection()
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
    if (!this.selectedFace) return

    const key = event.key.toLowerCase()
    const shift = event.shiftKey
    const face = this.selectedFace
    const direction: 1 | -1 = shift ? -1 : 1

    // Arrow keys and WASD rotate the selected face
    if (key === 'arrowup' || key === 'w') {
      this.onMove({ face, direction })
    } else if (key === 'arrowdown' || key === 's') {
      this.onMove({ face, direction: -direction as 1 | -1 })
    } else if (key === 'arrowleft' || key === 'a') {
      this.onMove({ face, direction: -direction as 1 | -1 })
    } else if (key === 'arrowright' || key === 'd') {
      this.onMove({ face, direction })
    }
  }

  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this))
    this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this))
    this.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this))
    this.domElement.removeEventListener('mouseleave', this.onMouseUp.bind(this))
    this.domElement.removeEventListener('touchstart', this.onTouchStart.bind(this))
    this.domElement.removeEventListener('touchmove', this.onTouchMove.bind(this))
    this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this))
    window.removeEventListener('keydown', this.onKeyDown.bind(this))
  }
}
