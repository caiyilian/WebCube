import * as THREE from 'three'
import { CubeState } from '@shared/types.js'

// Face index in BoxGeometry material array: 0=+x(R), 1=-x(L), 2=+y(U), 3=-y(D), 4=+z(F), 5=-z(B)
const FACE_INDEX_MAP: Record<string, number> = {
  R: 0, L: 1, U: 2, D: 3, F: 4, B: 5,
}

// 魔方颜色定义
export const CUBE_COLORS = {
  white: 0xffffff,   // U (Up)
  yellow: 0xffff00,  // D (Down)
  green: 0x00ff00,   // F (Front)
  blue: 0x0000ff,    // B (Back)
  orange: 0xff8c00,  // L (Left)
  red: 0xff0000,     // R (Right)
  black: 0x1a1a1a    // 内部/边框
} as const

// Cubelet 尺寸
const CUBELET_SIZE = 0.9
const CUBELET_GAP = 0.05
const CUBELET_STEP = CUBELET_SIZE + CUBELET_GAP

export type CubeSize = 2 | 3 | 4

export interface CubeletData {
  mesh: THREE.Mesh
  logicalPosition: { x: number; y: number; z: number }
}

export class CubeRenderer {
  public cubelets: CubeletData[] = []
  public group: THREE.Group
  private isAnimating = false
  private animationDuration = 200
  private cubeSize: CubeSize = 3

  constructor(cubeSize: CubeSize = 3) {
    this.cubeSize = cubeSize
    this.group = new THREE.Group()
    this.createCube()
  }

  private createCube(): void {
    const half = (this.cubeSize - 1) / 2
    // 创建 N×N×N 个小立方体
    for (let x = -half; x <= half; x++) {
      for (let y = -half; y <= half; y++) {
        for (let z = -half; z <= half; z++) {
          const cubelet = this.createCubelet(x, y, z)
          this.cubelets.push(cubelet)
          this.group.add(cubelet.mesh)
        }
      }
    }
  }

  public setCubeSize(size: CubeSize): void {
    if (size === this.cubeSize) return
    this.cubeSize = size
    this.recreateCube()
  }

  private recreateCube(): void {
    // 清理旧的 cubelets
    this.cubelets.forEach(c => {
      c.mesh.geometry.dispose()
      ;(c.mesh.material as THREE.Material[]).forEach(m => m.dispose())
    })
    this.cubelets = []
    this.group.clear()
    this.createCube()
  }

  private createCubelet(x: number, y: number, z: number): CubeletData {
    // 创建 6 个面的材质
    const materials = this.getCubeletMaterials(x, y, z)
    
    // 创建几何体
    const geometry = new THREE.BoxGeometry(CUBELET_SIZE, CUBELET_SIZE, CUBELET_SIZE)
    
    // 创建网格
    const mesh = new THREE.Mesh(geometry, materials)
    
    // 设置位置
    mesh.position.set(x * CUBELET_STEP, y * CUBELET_STEP, z * CUBELET_STEP)
    
    // 存储逻辑位置
    mesh.userData.logicalPosition = { x, y, z }
    
    return {
      mesh,
      logicalPosition: { x, y, z }
    }
  }

  private getCubeletMaterials(x: number, y: number, z: number): THREE.Material[] {
    const half = (this.cubeSize - 1) / 2
    // 面顺序: +x, -x, +y, -y, +z, -z (Right, Left, Up, Down, Front, Back)
    const getFaceColor = (face: 'right' | 'left' | 'up' | 'down' | 'front' | 'back'): THREE.Material => {
      let color: number = CUBE_COLORS.black
      
      switch (face) {
        case 'right':  color = x === half ? CUBE_COLORS.red : CUBE_COLORS.black; break
        case 'left':   color = x === -half ? CUBE_COLORS.orange : CUBE_COLORS.black; break
        case 'up':     color = y === half ? CUBE_COLORS.white : CUBE_COLORS.black; break
        case 'down':   color = y === -half ? CUBE_COLORS.yellow : CUBE_COLORS.black; break
        case 'front':  color = z === half ? CUBE_COLORS.green : CUBE_COLORS.black; break
        case 'back':   color = z === -half ? CUBE_COLORS.blue : CUBE_COLORS.black; break
      }

      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.3
      })
    }

    return [
      getFaceColor('right'),   // +x
      getFaceColor('left'),    // -x
      getFaceColor('up'),      // +y
      getFaceColor('down'),    // -y
      getFaceColor('front'),   // +z
      getFaceColor('back')     // -z
    ]
  }

  // 获取指定层的所有 cubelet
  public getLayerCubelets(axis: 'x' | 'y' | 'z', layer: number): CubeletData[] {
    return this.cubelets.filter(c => c.logicalPosition[axis] === layer)
  }

  public getCubeSize(): CubeSize {
    return this.cubeSize
  }

  // 获取整个魔方组
  public getGroup(): THREE.Group {
    return this.group
  }

  // 旋转层动画
  public async rotateLayer(
    axis: 'x' | 'y' | 'z',
    layer: number,
    direction: 1 | -1,
    duration?: number
  ): Promise<void> {
    if (this.isAnimating) return
    this.isAnimating = true

    const animDuration = duration ?? this.animationDuration
    const layerCubelets = this.getLayerCubelets(axis, layer)
    
    if (layerCubelets.length === 0) {
      this.isAnimating = false
      return
    }

    // 创建临时组
    const tempGroup = new THREE.Group()
    this.group.add(tempGroup)

    // 将属于该层的 cubelet 移入临时组
    layerCubelets.forEach(c => {
      this.group.attach(c.mesh)
      tempGroup.add(c.mesh)
    })

    // 计算目标旋转角度
    const targetAngle = direction * Math.PI / 2
    const startTime = performance.now()

    return new Promise<void>((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / animDuration, 1)
        const easedProgress = this.easeOutCubic(progress)
        
        tempGroup.rotation[axis] = targetAngle * easedProgress

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // 动画完成，重新附加到主组并更新逻辑位置
          tempGroup.rotation[axis] = targetAngle
          
          layerCubelets.forEach(c => {
            this.group.attach(c.mesh)
            this.updateLogicalPosition(c.logicalPosition, axis, direction)
          })
          
          this.group.remove(tempGroup)
          this.isAnimating = false
          resolve()
        }
      }

      animate()
    })
  }

  // 更新逻辑位置
  private updateLogicalPosition(
    pos: { x: number; y: number; z: number },
    axis: 'x' | 'y' | 'z',
    direction: 1 | -1
  ): void {
    const x = Math.round(pos.x)
    const y = Math.round(pos.y)
    const z = Math.round(pos.z)

    switch (axis) {
      case 'x':
        pos.y = -direction * z
        pos.z = direction * y
        break
      case 'y':
        pos.x = direction * z
        pos.z = -direction * x
        break
      case 'z':
        pos.x = -direction * y
        pos.y = direction * x
        break
    }
  }

  // 缓动函数
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  // 设置动画时长
  public setAnimationDuration(duration: number): void {
    this.animationDuration = duration
  }

  // 高亮显示层
  public highlightLayer(axis: 'x' | 'y' | 'z', layer: number, enabled: boolean): void {
    const layerCubelets = this.getLayerCubelets(axis, layer)
    layerCubelets.forEach(c => {
      const materials = c.mesh.material as THREE.Material[]
      materials.forEach(mat => {
        if (enabled) {
          ;(mat as THREE.MeshStandardMaterial).emissive.setHex(0xffff00)
          ;(mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.5
        } else {
          ;(mat as THREE.MeshStandardMaterial).emissive.setHex(0x000000)
          ;(mat as THREE.MeshStandardMaterial).emissiveIntensity = 0
        }
      })
    })
  }

  // 直接高亮某个网格的某个面
  public selectMeshFace(mesh: THREE.Mesh, face: string): void {
    this.clearSelection()
    const faceKey = face as keyof typeof FACE_INDEX_MAP
    const faceIndex = FACE_INDEX_MAP[faceKey]
    if (faceIndex === undefined) return

    const materials = mesh.material as THREE.Material[]
    if (materials && materials[faceIndex]) {
      const mat = materials[faceIndex]
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.emissive.setHex(0x00ff00)
        mat.emissiveIntensity = 0.8
      }
    }
  }

  // Directly highlight the material hit by the raycaster.
  public selectMeshMaterial(mesh: THREE.Mesh, materialIndex: number): void {
    this.clearSelection()

    const materials = mesh.material as THREE.Material[]
    const mat = materials[materialIndex]
    if (mat instanceof THREE.MeshStandardMaterial) {
      mat.emissive.setHex(0x00ff00)
      mat.emissiveIntensity = 0.8
    }
  }

  // 选中某个面的某个贴纸（保留用于兼容）
  public selectSticker(face: string, index: number, _uv?: THREE.Vector2): void {
    this.clearSelection()
    const faceKey = face as keyof typeof FACE_INDEX_MAP
    const faceIndex = FACE_INDEX_MAP[faceKey]
    if (faceIndex === undefined) return

    const half = (this.cubeSize - 1) / 2
    const layerValue = face === 'R' || face === 'U' || face === 'F' ? half : -half
    const axis = face === 'R' || face === 'L' ? 'x' : face === 'U' || face === 'D' ? 'y' : 'z'

    // Find all cubelets on this face
    const layerCubelets = this.getLayerCubelets(axis, layerValue)

    // Find the specific cubelet by row/col
    const row = Math.floor(index / this.cubeSize)
    const col = index % this.cubeSize

    for (const c of layerCubelets) {
      const pos = c.logicalPosition
      let matches = false

      switch (face) {
        case 'R': // viewed from +X: +Z is left, +Y is up
          matches = (pos.y === (half - row)) && (pos.z === (half - col))
          break
        case 'L': // viewed from -X: +Z is right, +Y is up
          matches = (pos.y === (half - row)) && (pos.z === (col - half))
          break
        case 'U': // viewed from +Y: +X is right, +Z is down
          matches = (pos.z === (row - half)) && (pos.x === (col - half))
          break
        case 'D': // viewed from -Y: +X is right, +Z is up
          matches = (pos.z === (half - row)) && (pos.x === (col - half))
          break
        case 'F': // viewed from +Z: +X is right, +Y is up
          matches = (pos.y === (half - row)) && (pos.x === (col - half))
          break
        case 'B': // viewed from -Z: +X is left, +Y is up
          matches = (pos.y === (half - row)) && (pos.x === (half - col))
          break
      }

      if (matches) {
        const materials = c.mesh.material as THREE.Material[]
        const mat = materials[faceIndex]
        if (mat && mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive.setHex(0x00ff00)
          mat.emissiveIntensity = 0.8
        }
        break
      }
    }
  }

  // 清除选中
  public clearSelection(): void {
    this.cubelets.forEach(c => {
      const materials = c.mesh.material as THREE.Material[]
      materials.forEach(mat => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive.setHex(0x000000)
          mat.emissiveIntensity = 0
        }
      })
    })
  }

  // 从逻辑状态更新渲染
  public updateFromState(_state: CubeState): void {
    // 根据逻辑状态更新每个 cubelet 的颜色
    // 这是一个简化版本，完整实现需要将每个贴纸映射到对应的 cubelet 面
    this.cubelets.forEach(c => {
      void c.logicalPosition
      void c.mesh.material
      
      // 根据位置确定可见面并更新颜色
      // 这里简化处理，实际需要更复杂的映射
    })
  }

  // 重置为初始状态
  public reset(): void {
    this.cubelets.forEach(c => {
      const pos = c.logicalPosition
      const materials = this.getCubeletMaterials(pos.x, pos.y, pos.z)
      c.mesh.material = materials
      c.mesh.position.set(pos.x * CUBELET_STEP, pos.y * CUBELET_STEP, pos.z * CUBELET_STEP)
      c.mesh.rotation.set(0, 0, 0)
    })
  }

  // 清理资源
  public dispose(): void {
    this.cubelets.forEach(c => {
      c.mesh.geometry.dispose()
      ;(c.mesh.material as THREE.Material[]).forEach(m => m.dispose())
    })
    this.group.clear()
  }
}
