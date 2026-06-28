import { describe, expect, it, vi } from 'vitest'
import { HUD } from '../components/HUD'

describe('HUD', () => {
  it('updates the visible move count text', () => {
    const hud = new HUD()

    hud.setMoveCount(1)

    expect(hud.element.querySelector('.hud-moves')?.textContent).toBe('1 步')
  })

  it('triggers undo and redo from buttons', () => {
    const hud = new HUD()
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    hud.setCallbacks({ onUndo, onRedo })

    ;(hud.element.querySelector('[data-action="undo"]') as HTMLButtonElement).click()
    ;(hud.element.querySelector('[data-action="redo"]') as HTMLButtonElement).click()

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it('triggers undo and redo from keyboard shortcuts', () => {
    const hud = new HUD()
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    hud.setCallbacks({ onUndo, onRedo })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }))

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(2)
  })

  it('shows solving status and disables conflicting actions', () => {
    const hud = new HUD()

    hud.setSolving(true)

    expect(hud.element.querySelector('.hud-status')?.textContent).toBe('求解中...')
    expect((hud.element.querySelector('[data-action="solve"]') as HTMLButtonElement).disabled).toBe(true)
    expect((hud.element.querySelector('[data-action="scramble"]') as HTMLButtonElement).disabled).toBe(true)
    expect((hud.element.querySelector('[data-action="settings"]') as HTMLButtonElement).disabled).toBe(false)

    hud.setSolving(false)

    expect(hud.element.querySelector('.hud-status')?.textContent).toBe('')
    expect((hud.element.querySelector('[data-action="solve"]') as HTMLButtonElement).disabled).toBe(false)
  })
})
