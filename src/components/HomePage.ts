import type { GameMode } from '../../shared/types'

export type CubeSize = 2 | 3 | 4

export interface HomePage {
  element: HTMLElement
  onModeSelect: (mode: GameMode, cubeSize: CubeSize) => void
}

export function createHomePage(): HomePage {
  let selectedCubeSize: CubeSize = 3
  
  const container = document.createElement('div')
  container.className = 'home-container'
  container.innerHTML = `
    <div class="home-content">
      <h1 class="home-title">WebCube</h1>
      <p class="home-subtitle">网页版魔方游戏</p>
      
      <div class="home-size-selector">
        <label class="home-size-label">魔方阶数:</label>
        <div class="home-size-buttons">
          <button class="home-size-btn" data-size="2">2×2</button>
          <button class="home-size-btn active" data-size="3">3×3</button>
          <button class="home-size-btn" data-size="4">4×4</button>
        </div>
      </div>
      
      <div class="home-modes">
        <button class="home-mode-card" data-mode="practice">
          <div class="home-mode-icon">🧩</div>
          <div class="home-mode-title">练习模式</div>
          <div class="home-mode-desc">单人练习，支持 AI 提示</div>
        </button>
        
        <button class="home-mode-card" data-mode="1v1">
          <div class="home-mode-icon">⚔️</div>
          <div class="home-mode-title">1v1 对战</div>
          <div class="home-mode-desc">实时竞速，谁先还原谁获胜</div>
        </button>
        
        <button class="home-mode-card" data-mode="coop">
          <div class="home-mode-icon">🤝</div>
          <div class="home-mode-title">协作模式</div>
          <div class="home-mode-desc">2-4 人共同解一个魔方</div>
        </button>
      </div>
      
      <div class="home-footer">
        <p>点击贴纸后，使用方向键或 WASD 按面向贴纸的方向旋转</p>
        <p>拖动画面可调整观察视角</p>
      </div>
    </div>
  `

  const homePage: HomePage = {
    element: container,
    onModeSelect: (mode: GameMode, cubeSize: CubeSize) => {
      window.location.hash = `${mode}-${cubeSize}`
    },
  }

  // Add click handlers for cube size
  container.querySelectorAll('.home-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = parseInt((btn as HTMLElement).dataset.size!) as CubeSize
      selectedCubeSize = size
      container.querySelectorAll('.home-size-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  // Add click handlers for mode
  container.querySelectorAll('.home-mode-card').forEach(card => {
    card.addEventListener('click', () => {
      const mode = (card as HTMLElement).dataset.mode as GameMode
      homePage.onModeSelect(mode, selectedCubeSize)
    })
  })

  return homePage
}
