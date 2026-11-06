import { describe, expect, it } from 'vitest'
import { DEFAULT_LOGO_CONFIG, THEME_PRESETS } from './types'
import { ProceduralStormAudio } from './audio'
import { BUMPER_SPECS, evaluateBumperState } from './bumperTimeline'
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

describe('Deterministic Bumper Timeline Choreography', () => {
  it('evaluates Bumper 01 (storm-ignition) deterministically across Acts I-III', () => {
    expect(BUMPER_SPECS['storm-ignition'].durationSec).toBe(4.5)
    expect(BUMPER_SPECS['storm-ignition'].totalFrames).toBe(270)

    const start = evaluateBumperState('storm-ignition', 0)
    const interStroke = evaluateBumperState('storm-ignition', 1.2)
    const strikePeak = evaluateBumperState('storm-ignition', 1.25)
    const surge = evaluateBumperState('storm-ignition', 1.65)
    const lockup = evaluateBumperState('storm-ignition', 4.2)

    // Act I starts close with crisp warm filaments, sharp STUDIOMARK text, and cinema black fade-in
    expect(start.neonIntensity).toBeCloseTo(0.85, 2)
    expect(start.textEmissiveScale).toBe(1.0)
    expect(start.fadeBlackOpacity).toBeCloseTo(1.0, 2)
    expect(start.hudOpacity).toBe(0)

    // Act II triggers realistic double-pulse lightning (brief inter-stroke dim at +0.05s, peak at +0.10s) and controlled filament surge
    expect(interStroke.lightningIntensity).toBeCloseTo(0.12, 2)
    expect(strikePeak.lightningIntensity).toBeGreaterThan(0.85)
    expect(surge.neonIntensity).toBeGreaterThan(2.2)

    // Act III settles into puddle-reflection hero lockup with constant sharp textEmissiveScale
    expect(lockup.fadeBlackOpacity).toBe(0)
    expect(lockup.hudOpacity).toBeCloseTo(1.0, 2)
    expect(lockup.textEmissiveScale).toBe(1.0)
    expect(lockup.cameraPosition[1]).toBeCloseTo(1.02, 1)
    expect(lockup.cameraPosition[2]).toBeCloseTo(5.25, 2)
    expect(lockup.cameraTarget[1]).toBeCloseTo(0.56, 2)
    expect(Math.abs(lockup.monogramRotation[1])).toBeLessThan(0.06)
  })

  it('evaluates Bumper 04 (puddle-crane) from low water-level mirror gaze to hero lockup', () => {
    expect(BUMPER_SPECS['puddle-crane'].durationSec).toBe(5.0)
    expect(BUMPER_SPECS['puddle-crane'].totalFrames).toBe(300)

    const puddleGaze = evaluateBumperState('puddle-crane', 0.3)
    const midCrane = evaluateBumperState('puddle-crane', 2.25)
    const heroLock = evaluateBumperState('puddle-crane', 4.6)

    // Starts low above the puddle surface looking down at the reflection
    expect(puddleGaze.cameraPosition[1]).toBeLessThan(0.45)
    expect(puddleGaze.cameraTarget[1]).toBeLessThan(0.35)
    expect(puddleGaze.puddleReflectivity).toBeGreaterThan(0.9)

    // Mid-crane ascent has active lightning silhouette
    expect(midCrane.lightningIntensity).toBeGreaterThan(0.85)
    expect(midCrane.cameraPosition[1]).toBeGreaterThan(puddleGaze.cameraPosition[1])

    // Hero lockup reaches reflection-balanced framing with HUD signature
    expect(heroLock.cameraPosition[1]).toBeCloseTo(1.02, 2)
    expect(heroLock.cameraTarget[1]).toBeCloseTo(0.56, 2)
    expect(heroLock.hudOpacity).toBeCloseTo(1.0, 2)
  })
})


