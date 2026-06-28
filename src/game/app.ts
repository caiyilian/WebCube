import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CubeRenderer } from './CubeRenderer'
import { Interaction } from './Interaction'
import { CubeState } from './CubeState'
import { Solver } from './Solver'
import { generateScramble, scrambleToString } from './Scramble'
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

  // 创建求解器
  const solver = new Solver()

  // 创建交互控制
  const interaction = new Interaction(cubeRenderer, scene, camera, renderer)
  interaction.onMove((move) => {
    // 将交互操作转换为 Move 类型
    const moveType = formatMove(move.axis, move.layer, move.direction)
    cubeState.applyMove(moveType)
    console.log('Move executed:', moveType)
    console.log('Cube solved:', cubeState.isSolved())
  })

  // 打乱功能
  function scrambleCube(): void {
    const scramble = generateScramble(20)
    console.log('Scramble:', scrambleToString(scramble))
    
    // 应用打乱操作
    scramble.forEach(move => {
      cubeState.applyMove(move)
    })
    
    // 重新创建魔方以反映新状态
    scene.remove(cubeRenderer.getGroup())
    const newCubeRenderer = new CubeRenderer()
    scene.add(newCubeRenderer.getGroup())
    
    console.log('Cube scrambled!')
  }

  // 重置功能
  function resetCube(): void {
    cubeState.setState(cubeState.createSolvedState())
    
    // 重新创建魔方
    scene.remove(cubeRenderer.getGroup())
    const newCubeRenderer = new CubeRenderer()
    scene.add(newCubeRenderer.getGroup())
    
    console.log('Cube reset!')
  }

  // 自动求解功能
  async function solveCube(): Promise<void> {
    try {
      console.log('Solving...')
      const solution = await solver.solve(cubeState)
      console.log('Solution:', solution)
      
      // 解析解法字符串
      const moves = solution.split(' ').filter(m => m.length > 0)
      
      // 逐步执行解法
      for (const moveStr of moves) {
        const move = moveStr as Move
        cubeState.applyMove(move)
        console.log('Applied move:', move)
        
        // 等待 200ms
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      console.log('Cube solved!')
    } catch (error) {
      console.error('Solve failed:', error)
    }
  }

  // 添加控制按钮
  const buttonContainer = document.createElement('div')
  buttonContainer.style.position = 'absolute'
  buttonContainer.style.top = '20px'
  buttonContainer.style.left = '20px'
  buttonContainer.style.zIndex = '100'

  const scrambleButton = document.createElement('button')
  scrambleButton.textContent = '打乱'
  scrambleButton.style.padding = '10px 20px'
  scrambleButton.style.marginRight = '10px'
  scrambleButton.style.cursor = 'pointer'
  scrambleButton.onclick = scrambleCube
  buttonContainer.appendChild(scrambleButton)

  const resetButton = document.createElement('button')
  resetButton.textContent = '重置'
  resetButton.style.padding = '10px 20px'
  resetButton.style.marginRight = '10px'
  resetButton.style.cursor = 'pointer'
  resetButton.onclick = resetCube
  buttonContainer.appendChild(resetButton)

  const solveButton = document.createElement('button')
  solveButton.textContent = '求解'
  solveButton.style.padding = '10px 20px'
  solveButton.style.cursor = 'pointer'
  solveButton.onclick = solveCube
  buttonContainer.appendChild(solveButton)

  container.appendChild(buttonContainer)

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
