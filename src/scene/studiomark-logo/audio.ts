// Procedural Web Audio API rain and thunder synthesizer.
// Requires zero external audio files — 100% self-contained and infinitely non-looping.

export class ProceduralStormAudio {
  private ctx: AudioContext | null = null
  private rainSource: AudioBufferSourceNode | null = null
  private rainGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private isRunning = false
  private volume = 0.4

  constructor(initialVolume = 0.4) {
    this.volume = initialVolume
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  /** Generate 4 seconds of continuous pink/rain noise in a loopable audio buffer */
  private createRainNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 4
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      let b0 = 0
      let b1 = 0
      let b2 = 0
      let b3 = 0
      let b4 = 0
      let b5 = 0
      let b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    }
    return buffer
  }

  /** Start ambient rain noise with gentle fade-in */
  public startRain() {
    try {
      const ctx = this.initContext()
      if (this.isRunning) return

      const noiseBuffer = this.createRainNoiseBuffer(ctx)
      this.rainSource = ctx.createBufferSource()
      this.rainSource.buffer = noiseBuffer
      this.rainSource.loop = true

      // Rain shaping filters: bandpass + lowpass for cozy raindrop patter
      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(1100, ctx.currentTime)
      bandpass.Q.setValueAtTime(0.65, ctx.currentTime)

      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.setValueAtTime(2800, ctx.currentTime)

      this.rainGain = ctx.createGain()
      this.rainGain.gain.setValueAtTime(0.001, ctx.currentTime)
      this.rainGain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 1.2)

      this.rainSource.connect(bandpass)
      bandpass.connect(lowpass)
      lowpass.connect(this.rainGain)
      this.rainGain.connect(this.masterGain!)

      this.rainSource.start()
      this.isRunning = true
    } catch {
      // Audio playback blocked or unsupported
    }
  }

  /** Stop ambient rain with fade-out */
  public stopRain() {
    if (!this.isRunning || !this.ctx || !this.rainGain) return
    const now = this.ctx.currentTime
    this.rainGain.gain.setValueAtTime(this.rainGain.gain.value, now)
    this.rainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
    setTimeout(() => {
      try {
        this.rainSource?.stop()
        this.rainSource?.disconnect()
      } catch {
        // already stopped
      }
      this.rainSource = null
      this.isRunning = false
    }, 850)
  }

  /** Play a deep, rumbling procedural thunder clap */
  public triggerThunder(intensity = 1.0) {
    try {
      const ctx = this.initContext()
      const now = ctx.currentTime

      // Sub-bass rumble oscillator
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      const startFreq = 65 + Math.random() * 20
      osc.frequency.setValueAtTime(startFreq, now)
      osc.frequency.exponentialRampToValueAtTime(28, now + 2.5)

      // Rumble noise envelope
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.85))
      }
      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer

      const rumbleFilter = ctx.createBiquadFilter()
      rumbleFilter.type = 'lowpass'
      rumbleFilter.frequency.setValueAtTime(120, now)
      rumbleFilter.frequency.exponentialRampToValueAtTime(45, now + 2.2)

      const thunderGain = ctx.createGain()
      thunderGain.gain.setValueAtTime(0.01, now)
      // Rapid strike peak
      thunderGain.gain.linearRampToValueAtTime(0.7 * intensity, now + 0.08)
      // Slow reverberant decay
      thunderGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2)

      osc.connect(thunderGain)
      noiseSource.connect(rumbleFilter)
      rumbleFilter.connect(thunderGain)
      thunderGain.connect(this.masterGain!)

      osc.start(now)
      noiseSource.start(now)
      osc.stop(now + 3.4)
      noiseSource.stop(now + 3.4)
    } catch {
      // AudioContext unavailable
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val))
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning
  }

  public dispose() {
    this.stopRain()
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close()
    }
    this.ctx = null
  }
}

