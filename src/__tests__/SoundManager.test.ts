import { describe, it, expect, beforeEach } from 'vitest'
import { SoundManager } from '../game/SoundManager.js'

describe('SoundManager', () => {
  let soundManager: SoundManager

  beforeEach(() => {
    // Clear any stored settings
    localStorage.clear()
    soundManager = new SoundManager()
  })

  describe('initial state', () => {
    it('starts enabled by default', () => {
      expect(soundManager.isEnabled()).toBe(true)
    })

    it('starts with default volume 0.3', () => {
      expect(soundManager.getVolume()).toBe(0.3)
    })
  })

  describe('setEnabled', () => {
    it('disables sound when set to false', () => {
      soundManager.setEnabled(false)
      expect(soundManager.isEnabled()).toBe(false)
    })

    it('re-enables sound when set to true', () => {
      soundManager.setEnabled(false)
      soundManager.setEnabled(true)
      expect(soundManager.isEnabled()).toBe(true)
    })
  })

  describe('setVolume', () => {
    it('sets volume correctly', () => {
      soundManager.setVolume(0.5)
      expect(soundManager.getVolume()).toBe(0.5)
    })

    it('clamps volume to minimum 0', () => {
      soundManager.setVolume(-0.5)
      expect(soundManager.getVolume()).toBe(0)
    })

    it('clamps volume to maximum 1', () => {
      soundManager.setVolume(1.5)
      expect(soundManager.getVolume()).toBe(1)
    })
  })

  describe('persistence', () => {
    it('persists disabled state to localStorage', () => {
      soundManager.setEnabled(false)
      const saved = localStorage.getItem('webcube-sound')
      expect(saved).not.toBeNull()
    })

    it('persists volume to localStorage', () => {
      soundManager.setVolume(0.8)
      const saved = localStorage.getItem('webcube-sound')
      expect(saved).not.toBeNull()
    })
  })
})
