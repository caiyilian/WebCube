export type SoundType = 'move' | 'solve' | 'click' | 'scramble'

export class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private volume: number = 0.3
  private storageKey = 'webcube-sound'

  constructor() {
    this.loadSettings()
  }

  private initContext(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.saveSettings()
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  getVolume(): number {
    return this.volume
  }

  play(type: SoundType): void {
    if (!this.enabled) return
    this.initContext()
    if (!this.audioContext) return

    switch (type) {
      case 'move':
        this.playMoveSound()
        break
      case 'solve':
        this.playSolveSound()
        break
      case 'click':
        this.playClickSound()
        break
      case 'scramble':
        this.playScrambleSound()
        break
    }
  }

  private playMoveSound(): void {
    if (!this.audioContext) return
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05)

    gain.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08)

    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + 0.08)
  }

  private playSolveSound(): void {
    if (!this.audioContext) return
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()

      osc.connect(gain)
      gain.connect(this.audioContext!.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, this.audioContext!.currentTime + i * 0.1)

      gain.gain.setValueAtTime(this.volume * 0.6, this.audioContext!.currentTime + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + i * 0.1 + 0.3)

      osc.start(this.audioContext!.currentTime + i * 0.1)
      osc.stop(this.audioContext!.currentTime + i * 0.1 + 0.3)
    })
  }

  private playClickSound(): void {
    if (!this.audioContext) return
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(800, this.audioContext.currentTime)

    gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03)

    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + 0.03)
  }

  private playScrambleSound(): void {
    if (!this.audioContext) return
    // Play 5 quick random tones
    for (let i = 0; i < 5; i++) {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.connect(gain)
      gain.connect(this.audioContext.destination)

      osc.type = 'sine'
      const freq = 300 + Math.random() * 400
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.06)

      gain.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime + i * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.06 + 0.05)

      osc.start(this.audioContext.currentTime + i * 0.06)
      osc.stop(this.audioContext.currentTime + i * 0.06 + 0.05)
    }
  }

  private loadSettings(): void {
    const saved = localStorage.getItem(this.storageKey)
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        this.enabled = settings.enabled ?? true
        this.volume = settings.volume ?? 0.3
      } catch {
        // Use defaults
      }
    }
  }

  private saveSettings(): void {
    localStorage.setItem(this.storageKey, JSON.stringify({
      enabled: this.enabled,
      volume: this.volume,
    }))
  }
}

export const soundManager = new SoundManager()
