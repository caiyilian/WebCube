import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CubeRenderer } from './CubeRenderer'

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
