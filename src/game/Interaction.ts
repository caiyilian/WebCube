import * as THREE from 'three'
import { CubeRenderer } from './CubeRenderer.js'
import { Move, MoveFace } from '@shared/types.js'

type Axis = 'x' | 'y' | 'z'

export class Interaction {
  private renderer: CubeRenderer
  private camera: THREE.Camera
  private domElement: HTMLElement
  private onMove: (move: Move) => void

  // Selection
  private selectedFace: 'R' | 'L' | 'U' | 'D' | 'F' | 'B' | null = null
  private selectedStickerPosition: THREE.Vector3 | null = null
  private selectedFaceNormal: THREE.Vector3 | null = null

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
    this.selectedStickerPosition = new THREE.Vector3()
    hit.object.getWorldPosition(this.selectedStickerPosition)
    this.selectedFaceNormal = normal.normalize()
    this.renderer.selectMeshMaterial(hit.object, hit.face.materialIndex)
  }

  private clearSelection(): void {
    this.selectedFace = null
    this.selectedStickerPosition = null
    this.selectedFaceNormal = null
    this.renderer.clearSelection()
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
    if (!this.selectedFace) return

    const key = event.key.toLowerCase()
    const keyDirection = this.getKeyDirection(key)
    if (!keyDirection) return

    const move = this.getMoveForKey(keyDirection, event.shiftKey)
    if (!move) return

    this.updateSelectionFromMove(move)
    this.onMove(move)
  }

  private getKeyDirection(key: string): THREE.Vector2 | null {
    if (key === 'arrowup' || key === 'w') return new THREE.Vector2(0, 1)
    if (key === 'arrowdown' || key === 's') return new THREE.Vector2(0, -1)
    if (key === 'arrowleft' || key === 'a') return new THREE.Vector2(-1, 0)
    if (key === 'arrowright' || key === 'd') return new THREE.Vector2(1, 0)
    return null
  }

  private getMoveForKey(keyDirection: THREE.Vector2, invert: boolean): Move | null {
    if (!this.selectedFace || !this.selectedStickerPosition || !this.selectedFaceNormal) {
      return null
    }

    if (keyDirection.x !== 0) {
      const baseMove = { face: this.selectedFace }
      const direction = this.chooseDirection(baseMove, ({ delta }) => {
        const screenDelta = this.projectedScreenDelta(this.selectedStickerPosition!, delta)
        return screenDelta.dot(keyDirection)
      })
      return { face: this.selectedFace, direction: invert ? (-direction as 1 | -1) : direction }
    }

    const axis = this.getHorizontalAxisForSelectedFace()
    const layer = this.getLayerForAxis(axis)
    const face = this.faceFromAxisLayer(axis, layer)
    const desired = keyDirection.y > 0
      ? this.selectedFaceNormal.clone().negate()
      : this.selectedFaceNormal.clone()
    const baseMove = { face, axis, layer }
    const direction = this.chooseDirection(baseMove, ({ delta }) => delta.dot(desired))

    return {
      face,
      axis,
      layer,
      direction: invert ? (-direction as 1 | -1) : direction,
    }
  }

  private projectedScreenDelta(origin: THREE.Vector3, delta: THREE.Vector3): THREE.Vector2 {
    const start = origin.clone().project(this.camera)
    const end = origin.clone().add(delta).project(this.camera)
    return new THREE.Vector2(end.x - start.x, end.y - start.y).normalize()
  }

  private chooseDirection(
    move: Pick<Move, 'face' | 'axis' | 'layer'>,
    score: (result: { delta: THREE.Vector3; normal: THREE.Vector3 }) => number
  ): 1 | -1 {
    const positive = this.simulateMove(move, 1)
    const negative = this.simulateMove(move, -1)
    return score(positive) >= score(negative) ? 1 : -1
  }

  private simulateMove(
    move: Pick<Move, 'face' | 'axis' | 'layer'>,
    direction: 1 | -1
  ): { position: THREE.Vector3; delta: THREE.Vector3; normal: THREE.Vector3 } {
    const axis = move.axis ?? this.axisFromFace(move.face)
    const layer = move.layer ?? this.layerFromFace(move.face)
    const axisVector = this.axisVector(axis)
    const renderDirection = layer >= 0 ? -direction : direction
    const rotation = new THREE.Matrix4().makeRotationAxis(axisVector, renderDirection * Math.PI / 2)
    const position = this.selectedStickerPosition!.clone().applyMatrix4(rotation)
    const normal = this.selectedFaceNormal!.clone().applyMatrix4(rotation).normalize()

    return {
      position,
      delta: position.clone().sub(this.selectedStickerPosition!),
      normal,
    }
  }

  private updateSelectionFromMove(move: Move): void {
    if (!this.selectedStickerPosition || !this.selectedFaceNormal) return

    const result = this.simulateMove(move, move.direction)
    this.selectedStickerPosition.copy(result.position)
    this.selectedFaceNormal.copy(result.normal)
    this.selectedFace = this.faceFromNormal(result.normal)
  }

  private getHorizontalAxisForSelectedFace(): Axis {
    const cameraRight = new THREE.Vector3()
    const matrix = this.camera.matrixWorld.elements
    cameraRight.set(matrix[0], matrix[1], matrix[2]).normalize()

    const faceRight = cameraRight
      .sub(this.selectedFaceNormal!.clone().multiplyScalar(cameraRight.dot(this.selectedFaceNormal!)))
      .normalize()

    return this.dominantAxis(faceRight)
  }

  private getLayerForAxis(axis: Axis): number {
    return this.toLayer(this.selectedStickerPosition![axis])
  }

  private toLayer(value: number): number {
    if (value > 0.35) return 1
    if (value < -0.35) return -1
    return 0
  }

  private dominantAxis(vector: THREE.Vector3): Axis {
    const absX = Math.abs(vector.x)
    const absY = Math.abs(vector.y)
    const absZ = Math.abs(vector.z)
    if (absX >= absY && absX >= absZ) return 'x'
    if (absY >= absX && absY >= absZ) return 'y'
    return 'z'
  }

  private axisVector(axis: Axis): THREE.Vector3 {
    if (axis === 'x') return new THREE.Vector3(1, 0, 0)
    if (axis === 'y') return new THREE.Vector3(0, 1, 0)
    return new THREE.Vector3(0, 0, 1)
  }

  private axisFromFace(face: MoveFace): Axis {
    if (face === 'R' || face === 'L') return 'x'
    if (face === 'U' || face === 'D') return 'y'
    return 'z'
  }

  private layerFromFace(face: MoveFace): number {
    return face === 'R' || face === 'U' || face === 'F' ? 1 : -1
  }

  private faceFromAxisLayer(axis: Axis, layer: number): MoveFace {
    if (axis === 'x') return layer >= 0 ? 'R' : 'L'
    if (axis === 'y') return layer >= 0 ? 'U' : 'D'
    return layer >= 0 ? 'F' : 'B'
  }

  private faceFromNormal(normal: THREE.Vector3): MoveFace {
    const axis = this.dominantAxis(normal)
    if (axis === 'x') return normal.x >= 0 ? 'R' : 'L'
    if (axis === 'y') return normal.y >= 0 ? 'U' : 'D'
    return normal.z >= 0 ? 'F' : 'B'
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
