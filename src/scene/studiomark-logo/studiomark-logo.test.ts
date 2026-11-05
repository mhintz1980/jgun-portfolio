import { describe, expect, it } from 'vitest'
import { DEFAULT_LOGO_CONFIG, THEME_PRESETS } from './types'
import { ProceduralStormAudio } from './audio'
import * as THREE from 'three'

describe('StudioMark 3D Logo Configuration & Theme Presets', () => {
  it('DEFAULT_LOGO_CONFIG has valid initial parameters', () => {
    expect(DEFAULT_LOGO_CONFIG.shape).toBe('sm-kinetic-chevron')
    expect(DEFAULT_LOGO_CONFIG.text).toBe('STUDIOMARK')
    expect(DEFAULT_LOGO_CONFIG.spin).toBe(true)
    expect(DEFAULT_LOGO_CONFIG.speed).toBeGreaterThan(0)
    expect(DEFAULT_LOGO_CONFIG.transmission).toBe(1.0)
    expect(DEFAULT_LOGO_CONFIG.roughness).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_LOGO_CONFIG.roughness).toBeLessThanOrEqual(1)
    expect(DEFAULT_LOGO_CONFIG.rainIntensity).toBe('heavy')
  })

  it('THEME_PRESETS has unique IDs and valid hex color formats', () => {
    const ids = THEME_PRESETS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const preset of THEME_PRESETS) {
      expect(preset.glowColor).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(preset.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(preset.bgTint).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('includes Studio Gold and Electric Cyan as primary signature presets', () => {
    const gold = THEME_PRESETS.find((t) => t.id === 'studio-gold')
    const cyan = THEME_PRESETS.find((t) => t.id === 'electric-cyan')
    expect(gold).toBeDefined()
    expect(cyan).toBeDefined()
    expect(gold?.glowColor).toBe('#d2c4a3')
    expect(cyan?.glowColor).toBe('#38e8ff')
  })
})

describe('ProceduralStormAudio Engine', () => {
  it('instantiates and handles volume clamping safely without throwing', () => {
    const audio = new ProceduralStormAudio(0.5)
    expect(audio.getIsRunning()).toBe(false)

    audio.setVolume(1.5)
    audio.setVolume(-0.5)
    audio.setVolume(0.35)

    // Stopping or triggering before context initialization should be safe no-ops
    expect(() => audio.stopRain()).not.toThrow()
    expect(() => audio.dispose()).not.toThrow()
  })
})

describe('CAD Procedural Geometries', () => {
  it('constructs Hex Gem geometry with central bore hole', () => {
    const shape = new THREE.Shape()
    const outerRadius = 1.35
    for (let i = 0; i < 6; i++) {
      const angle = (i * 2 * Math.PI) / 6
      const x = outerRadius * Math.cos(angle)
      const y = outerRadius * Math.sin(angle)
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()

    const hole = new THREE.Path()
    hole.absarc(0, 0, 0.48, 0, Math.PI * 2, true)
    shape.holes.push(hole)

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.65,
      bevelEnabled: true,
      bevelSegments: 2,
    })

    expect(geom.getAttribute('position').count).toBeGreaterThan(0)
    geom.computeBoundingBox()
    expect(geom.boundingBox).not.toBeNull()
    geom.dispose()
  })
})

