import * as THREE from 'three'

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

export interface CubeletData {
  mesh: THREE.Mesh
  logicalPosition: { x: number; y: number; z: number }
}

export class CubeRenderer {
  public cubelets: CubeletData[] = []
  public group: THREE.Group

  constructor() {
    this.group = new THREE.Group()
    this.createCube()
  }

  private createCube(): void {
    // 创建 27 个小立方体 (3x3x3)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubelet = this.createCubelet(x, y, z)
          this.cubelets.push(cubelet)
          this.group.add(cubelet.mesh)
        }
      }
    }
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
    // 面顺序: +x, -x, +y, -y, +z, -z (Right, Left, Up, Down, Front, Back)
    const getFaceColor = (face: 'right' | 'left' | 'up' | 'down' | 'front' | 'back'): THREE.Material => {
      let color: number = CUBE_COLORS.black
      
      switch (face) {
        case 'right':  color = x === 1 ? CUBE_COLORS.red : CUBE_COLORS.black; break
        case 'left':   color = x === -1 ? CUBE_COLORS.orange : CUBE_COLORS.black; break
        case 'up':     color = y === 1 ? CUBE_COLORS.white : CUBE_COLORS.black; break
        case 'down':   color = y === -1 ? CUBE_COLORS.yellow : CUBE_COLORS.black; break
        case 'front':  color = z === 1 ? CUBE_COLORS.green : CUBE_COLORS.black; break
        case 'back':   color = z === -1 ? CUBE_COLORS.blue : CUBE_COLORS.black; break
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

  // 获取整个魔方组
  public getGroup(): THREE.Group {
    return this.group
  }
}
