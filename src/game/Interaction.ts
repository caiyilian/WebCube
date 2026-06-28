import * as THREE from 'three'
import type { CubeRenderer, CubeletData } from './CubeRenderer'

export type MoveAxis = 'x' | 'y' | 'z'
export type MoveDirection = 1 | -1

export interface Move {
  axis: MoveAxis
  layer: number
  direction: MoveDirection
}

export class Interaction {
  private cubeRenderer: CubeRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2

  private isDragging: boolean = false
  private startPoint: THREE.Vector3 | null = null
  private startCubelet: CubeletData | null = null
  private moveGroup: THREE.Group | null = null
  private cubeletsInGroup: CubeletData[] = []

  private onMoveCallback: ((move: Move) => void) | null = null

  constructor(
    cubeRenderer: CubeRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.cubeRenderer = cubeRenderer
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.setupEventListeners()
  }

  public onMove(callback: (move: Move) => void): void {
    this.onMoveCallback = callback
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return // 只处理左键

    this.updateMouse(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const cubeletMeshes = this.cubeRenderer.cubelets.map(c => c.mesh)
    const intersects = this.raycaster.intersectObjects(cubeletMeshes)

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh
      const cubeletData = this.cubeRenderer.cubelets.find(c => c.mesh === intersectedMesh)
      
      if (cubeletData) {
        this.isDragging = true
        this.startPoint = intersects[0].point.clone()
        this.startCubelet = cubeletData
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.startPoint || !this.startCubelet) return

    this.updateMouse(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const cubeletMeshes = this.cubeRenderer.cubelets.map(c => c.mesh)
    const intersects = this.raycaster.intersectObjects(cubeletMeshes)

    if (intersects.length > 0) {
      const endPoint = intersects[0].point
      const delta = endPoint.clone().sub(this.startPoint)

      if (delta.length() > 0.1) {
        const move = this.determineMove(this.startCubelet, delta)
        if (move) {
          this.executeMove(move)
        }
        this.resetDrag()
      }
    }
  }

  private onMouseUp(): void {
    this.resetDrag()
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  private determineMove(startCubelet: CubeletData, delta: THREE.Vector3): Move | null {
    const absX = Math.abs(delta.x)
    const absY = Math.abs(delta.y)
    const absZ = Math.abs(delta.z)

    // 找出最大的移动方向
    let axis: MoveAxis
    let direction: MoveDirection

    if (absX > absY && absX > absZ) {
      axis = 'x'
      direction = delta.x > 0 ? 1 : -1
    } else if (absY > absZ) {
      axis = 'y'
      direction = delta.y > 0 ? 1 : -1
    } else {
      axis = 'z'
      direction = delta.z > 0 ? 1 : -1
    }

    // 确定层
    const layer = startCubelet.logicalPosition[axis]

    return { axis, layer, direction }
  }

  private executeMove(move: Move): void {
    // 获取该层的所有 cubelet
    const layerCubelets = this.cubeRenderer.getLayerCubelets(move.axis, move.layer)

    // 创建临时组
    this.moveGroup = new THREE.Group()
    this.cubeletsInGroup = layerCubelets

    // 将 cubelet 添加到临时组
    layerCubelets.forEach(cubelet => {
      this.moveGroup!.attach(cubelet.mesh)
    })

    this.scene.add(this.moveGroup)

    // 动画旋转
    const targetAngle = (Math.PI / 2) * move.direction
    const duration = 200
    const startTime = performance.now()

    const animateRotation = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // 缓动函数
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentAngle = targetAngle * eased

      switch (move.axis) {
        case 'x': this.moveGroup!.rotation.x = currentAngle; break
        case 'y': this.moveGroup!.rotation.y = currentAngle; break
        case 'z': this.moveGroup!.rotation.z = currentAngle; break
      }

      if (progress < 1) {
        requestAnimationFrame(animateRotation)
      } else {
        this.finishMove(move)
      }
    }

    requestAnimationFrame(animateRotation)
  }

  private finishMove(move: Move): void {
    if (!this.moveGroup) return

    // 将 cubelet 重新附加到场景
    this.cubeletsInGroup.forEach(cubelet => {
      this.scene.attach(cubelet.mesh)
      
      // 更新逻辑位置
      const pos = cubelet.mesh.position
      cubelet.logicalPosition.x = Math.round(pos.x)
      cubelet.logicalPosition.y = Math.round(pos.y)
      cubelet.logicalPosition.z = Math.round(pos.z)
    })

    // 移除临时组
    this.scene.remove(this.moveGroup)
    this.moveGroup = null
    this.cubeletsInGroup = []

    // 触发回调
    if (this.onMoveCallback) {
      this.onMoveCallback(move)
    }
  }

  private resetDrag(): void {
    this.isDragging = false
    this.startPoint = null
    this.startCubelet = null
  }
}
