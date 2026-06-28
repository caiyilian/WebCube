export type GameMode = 'practice' | 'battle' | 'coop'

export interface HomePage {
  element: HTMLElement
  onModeSelect: (mode: GameMode) => void
}

export function createHomePage(): HomePage {
  const container = document.createElement('div')
  container.className = 'home-container'
  container.innerHTML = `
    <div class="home-content">
      <h1 class="home-title">WebCube</h1>
      <p class="home-subtitle">网页版魔方游戏</p>
      
      <div class="home-modes">
        <button class="home-mode-card" data-mode="practice">
          <div class="home-mode-icon">🧩</div>
          <div class="home-mode-title">练习模式</div>
          <div class="home-mode-desc">单人练习，支持 AI 提示</div>
        </button>
        
        <button class="home-mode-card" data-mode="battle">
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
        <p>使用键盘 R/L/U/D/F/B 旋转，Shift 反转</p>
        <p>鼠标拖拽旋转面</p>
      </div>
    </div>
  `

  const _onModeSelect = (_mode: GameMode) => {
    // Navigation handled by hash change
  }
  void _onModeSelect

  // Add click handlers
  container.querySelectorAll('.home-mode-card').forEach(card => {
    card.addEventListener('click', () => {
      const mode = (card as HTMLElement).dataset.mode as GameMode
      window.location.hash = mode
    })
  })

  return { element: container, onModeSelect: _onModeSelect }
}
