import * as THREE from 'three'
import { CubeRenderer } from './CubeRenderer.js'
import { Move } from '@shared/types.js'

export class Interaction {
  private renderer: CubeRenderer
  private camera: THREE.Camera
  private domElement: HTMLElement
  private onMove: (move: Move) => void
  
  // Mouse state
  private isDragging = false
  private dragStart = new THREE.Vector2()
  private dragCurrent = new THREE.Vector2()
  private dragFace: 'R' | 'L' | 'U' | 'D' | 'F' | 'B' | null = null
  private dragAxis: 'x' | 'y' | 'z' | null = null
  private dragLayer: number | null = null
  private dragDirection: 1 | -1 = 1

  // Raycaster for face detection
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
    // Mouse events
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.domElement.addEventListener('mouseleave', this.onMouseUp.bind(this))
    
    // Touch events for mobile
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false })
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false })
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this))

    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown.bind(this))
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return // Only left click
    
    this.mouse.set(
      (event.clientX / this.domElement.clientWidth) * 2 - 1,
      -(event.clientY / this.domElement.clientHeight) * 2 + 1
    )

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.renderer.getGroup().children, true)

    if (intersects.length > 0) {
      const intersected = intersects[0].object
      if (intersected instanceof THREE.Mesh) {
        this.startDrag(intersected, event.clientX, event.clientY)
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return
    
    this.dragCurrent.set(event.clientX, event.clientY)
    this.updateDrag()
  }

  private onMouseUp(): void {
    if (this.isDragging) {
      this.endDrag()
    }
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return
    event.preventDefault()
    
    const touch = event.touches[0]
    this.mouse.set(
      (touch.clientX / this.domElement.clientWidth) * 2 - 1,
      -(touch.clientY / this.domElement.clientHeight) * 2 + 1
    )

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.renderer.getGroup().children, true)

    if (intersects.length > 0) {
      const intersected = intersects[0].object
      if (intersected instanceof THREE.Mesh) {
        this.startDrag(intersected, touch.clientX, touch.clientY)
      }
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return
    event.preventDefault()
    
    const touch = event.touches[0]
    this.dragCurrent.set(touch.clientX, touch.clientY)
    this.updateDrag()
  }

  private onTouchEnd(): void {
    if (this.isDragging) {
      this.endDrag()
    }
  }

  private startDrag(mesh: THREE.Mesh, clientX: number, clientY: number): void {
    // Get the cubelet's logical position
    const logicalPos = mesh.userData.logicalPosition
    if (!logicalPos) return

    // Determine which face was clicked based on camera view
    const face = this.getFaceFromClick(mesh, logicalPos)
    if (!face) return

    this.dragFace = face
    this.dragAxis = this.getAxisFromFace(face)
    this.dragLayer = this.getLayerFromFace(face, logicalPos)
    this.dragDirection = 1 // Will be determined by drag direction
    
    this.dragStart.set(clientX, clientY)
    this.dragCurrent.set(clientX, clientY)
    this.isDragging = true

    // Highlight the layer
    if (this.dragAxis && this.dragLayer !== null) {
      this.renderer.highlightLayer(this.dragAxis, this.dragLayer, true)
    }
  }

  private updateDrag(): void {
    if (!this.isDragging || !this.dragAxis || this.dragLayer === null) return

    const deltaX = this.dragCurrent.x - this.dragStart.x
    const deltaY = this.dragCurrent.y - this.dragStart.y

    // Determine drag direction based on axis and camera
    const direction = this.getDragDirection(this.dragAxis, deltaX, deltaY)
    if (direction !== this.dragDirection) {
      this.dragDirection = direction
    }
  }

  private endDrag(): void {
    if (!this.isDragging || !this.dragFace || !this.dragAxis || this.dragLayer === null) {
      this.resetDrag()
      return
    }

    // Check if drag distance is sufficient
    const dragDistance = Math.hypot(
      this.dragCurrent.x - this.dragStart.x,
      this.dragCurrent.y - this.dragStart.y
    )

    if (dragDistance > 30) {
      // Execute the move
      const move: Move = {
        face: this.dragFace,
        direction: this.dragDirection,
      }
      this.onMove(move)
    }

    this.resetDrag()
  }

  private resetDrag(): void {
    if (this.dragAxis && this.dragLayer !== null) {
      this.renderer.highlightLayer(this.dragAxis, this.dragLayer, false)
    }
    this.isDragging = false
    this.dragFace = null
    this.dragAxis = null
    this.dragLayer = null
    this.dragDirection = 1
  }

  private getFaceFromClick(
    mesh: THREE.Mesh,
    logicalPos: { x: number; y: number; z: number }
  ): 'R' | 'L' | 'U' | 'D' | 'F' | 'B' | null {
    // Determine which face of the cubelet is facing the camera
    const worldPos = new THREE.Vector3()
    mesh.getWorldPosition(worldPos)
    
    const cameraDir = new THREE.Vector3()
    this.camera.getWorldDirection(cameraDir)
    
    // Check which face normal is most aligned with camera direction
    const faces = [
      { face: 'R' as const, normal: new THREE.Vector3(1, 0, 0), pos: logicalPos.x },
      { face: 'L' as const, normal: new THREE.Vector3(-1, 0, 0), pos: logicalPos.x },
      { face: 'U' as const, normal: new THREE.Vector3(0, 1, 0), pos: logicalPos.y },
      { face: 'D' as const, normal: new THREE.Vector3(0, -1, 0), pos: logicalPos.y },
      { face: 'F' as const, normal: new THREE.Vector3(0, 0, 1), pos: logicalPos.z },
      { face: 'B' as const, normal: new THREE.Vector3(0, 0, -1), pos: logicalPos.z },
    ]

    // Only consider faces on the outer layer
    const outerFaces = faces.filter(f => Math.abs(f.pos) === 1)
    
    let bestFace: typeof outerFaces[0] | null = null
    let bestDot = -Infinity

    outerFaces.forEach(f => {
      const dot = f.normal.dot(cameraDir)
      if (dot > bestDot) {
        bestDot = dot
        bestFace = f
      }
    })

    return bestFace?.face ?? null
  }

  private getAxisFromFace(face: string): 'x' | 'y' | 'z' {
    switch (face) {
      case 'R':
      case 'L':
        return 'x'
      case 'U':
      case 'D':
        return 'y'
      case 'F':
      case 'B':
        return 'z'
    }
    return 'y'
  }

  private getLayerFromFace(face: string, logicalPos: { x: number; y: number; z: number }): number {
    switch (face) {
      case 'R':
        return logicalPos.x
      case 'L':
        return logicalPos.x
      case 'U':
        return logicalPos.y
      case 'D':
        return logicalPos.y
      case 'F':
        return logicalPos.z
      case 'B':
        return logicalPos.z
    }
    return 0
  }

  private getDragDirection(axis: 'x' | 'y' | 'z', deltaX: number, deltaY: number): 1 | -1 {
    // Simplified: use screen space deltas
    switch (axis) {
      case 'x': // R/L face - vertical drag rotates
        return deltaY > 0 ? -1 : 1
      case 'y': // U/D face - horizontal drag rotates
        return deltaX > 0 ? 1 : -1
      case 'z': // F/B face - diagonal drag
        return (deltaX + deltaY) > 0 ? 1 : -1
    }
    return 1
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Ignore if typing in input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return
    }

    const key = event.key.toUpperCase()
    const shift = event.shiftKey

    const keyMap: Record<string, { face: Move['face']; direction: 1 | -1 }> = {
      'R': { face: 'R', direction: 1 },
      'L': { face: 'L', direction: 1 },
      'U': { face: 'U', direction: 1 },
      'D': { face: 'D', direction: 1 },
      'F': { face: 'F', direction: 1 },
      'B': { face: 'B', direction: 1 },
    }

    if (keyMap[key]) {
      const move = keyMap[key]
      if (shift) {
        move.direction = -1
      }
      this.onMove(move)
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
