import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CubeRenderer } from './CubeRenderer'
import { Interaction } from './Interaction'
import { CubeState } from './CubeState'
import type { Move } from '../../shared/types'

export function createApp(): HTMLDivElement {
  const container = document.createElement('div')
  container.style.width = '100%'
  container.style.height = '100%'

  // 创建场景
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  // 创建相机
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(4, 4, 4)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  // 添加 OrbitControls 鼠标控制
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = true
  controls.enableZoom = true
  controls.minDistance = 3
  controls.maxDistance = 15

  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 7)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // 创建魔方
  const cubeRenderer = new CubeRenderer()
  scene.add(cubeRenderer.getGroup())

  // 创建逻辑状态
  const cubeState = new CubeState()

  // 创建交互控制
  const interaction = new Interaction(cubeRenderer, scene, camera, renderer)
  interaction.onMove((move) => {
    // 将交互操作转换为 Move 类型
    const moveType = formatMove(move.axis, move.layer, move.direction)
    cubeState.applyMove(moveType)
    console.log('Move executed:', moveType)
    console.log('Cube solved:', cubeState.isSolved())
  })

  // 动画循环
  function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  return container
}

// 格式化操作为 Move 类型
function formatMove(axis: string, layer: number, direction: number): Move {
  const face = getFaceFromAxis(axis, layer)
  const isCounterClockwise = direction === -1
  return `${face}${isCounterClockwise ? "'" : ''}` as Move
}

// 根据轴和层获取面
function getFaceFromAxis(axis: string, layer: number): string {
  if (axis === 'x') return layer === 1 ? 'R' : 'L'
  if (axis === 'y') return layer === 1 ? 'U' : 'D'
  if (axis === 'z') return layer === 1 ? 'F' : 'B'
  return 'R'
}
