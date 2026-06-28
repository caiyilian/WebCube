import { describe, expect, it, vi } from 'vitest'
import { createTournamentPage } from '../components/TournamentPage'

describe('TournamentPage', () => {
  it('creates a bracket and advances winners to a champion', () => {
    const page = createTournamentPage({ onBack: vi.fn() })
    ;(page.element.querySelector('[data-action="create"]') as HTMLButtonElement).click()

    expect(page.element.textContent).toContain('第 1 轮进行中')
    expect(page.element.textContent).toContain('玩家')

    let winnerButtons = Array.from(page.element.querySelectorAll<HTMLButtonElement>('[data-winner]'))
    winnerButtons[0].click()
    winnerButtons = Array.from(page.element.querySelectorAll<HTMLButtonElement>('[data-winner]'))
    winnerButtons[0].click()
    winnerButtons = Array.from(page.element.querySelectorAll<HTMLButtonElement>('[data-winner]'))
    winnerButtons[0].click()

    expect(page.element.textContent).toContain('冠军：')
  })
})
