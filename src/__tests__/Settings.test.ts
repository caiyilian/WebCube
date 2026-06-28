import { afterEach, describe, expect, it, vi } from 'vitest'
import { Settings } from '../components/Settings'
import { soundManager } from '../game/SoundManager'
import { themeManager } from '../game/ThemeManager'

describe('Settings', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('updates theme and sound settings through managers', () => {
    const setTheme = vi.spyOn(themeManager, 'setTheme').mockImplementation(() => undefined)
    const setEnabled = vi.spyOn(soundManager, 'setEnabled').mockImplementation(() => undefined)
    const setVolume = vi.spyOn(soundManager, 'setVolume').mockImplementation(() => undefined)
    vi.spyOn(soundManager, 'play').mockImplementation(() => undefined)
    const settings = new Settings()

    const themeSelect = settings.element.querySelector('.settings-theme') as HTMLSelectElement
    themeSelect.value = 'neon'
    themeSelect.dispatchEvent(new Event('change', { bubbles: true }))

    const soundEnabled = settings.element.querySelector('.settings-sound-enabled') as HTMLInputElement
    soundEnabled.checked = false
    soundEnabled.dispatchEvent(new Event('change', { bubbles: true }))

    const volume = settings.element.querySelector('.settings-volume') as HTMLInputElement
    volume.value = '0.65'
    volume.dispatchEvent(new Event('input', { bubbles: true }))

    expect(setTheme).toHaveBeenCalledWith('neon')
    expect(setEnabled).toHaveBeenCalledWith(false)
    expect(setVolume).toHaveBeenCalledWith(0.65)
    expect(settings.getSettings()).toMatchObject({
      theme: 'neon',
      soundEnabled: false,
      volume: 0.65,
    })
  })
})
