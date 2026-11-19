import { describe, expect, it } from 'vitest'
import { Matrix4, PerspectiveCamera, Vector3 } from 'three'
import { DRAWING_INTRO_WINDOW, drawingIntroState } from '../drawing/introTimeline'
import type { ExtractionContext } from '../drawing/poseCore'
import type { DrawingFrameInput } from './privateSheetRuntime'
import { createMetrologyWorkbenchProps } from './MetrologyWorkbenchProps'

function makeFrame(t: number, overrides: Partial<DrawingFrameInput> = {}): DrawingFrameInput {
  return {
    intro: drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd),
    tier: 'full',
    reducedMotion: false,
    proofMode: 'normal',
    retirement: 0,
    cameraLookTargetWorld: new Vector3(0, 0, 0),
    cameraSheetDistance: 0.45,
    delta: 1 / 60,
    ...overrides,
  }
}

const context: ExtractionContext = {
  sheetMatrix: new Matrix4().identity(),
  modelMatrix: new Matrix4().identity(),
}

describe('MetrologyWorkbenchProps', () => {
  it('installs all daytime metrology tools around the drawing sheet perimeter without overlapping the blueprint frame', () => {
    const wb = createMetrologyWorkbenchProps()
    const camera = new PerspectiveCamera(34, 16 / 9, 0.001, 30)
    camera.position.set(0, 0, 0.85)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld(true)

    wb.update(makeFrame(0.25), context, camera)
    const snap = wb.snapshot()
    expect(snap.visible).toBe(true)

    const ids = snap.props.map(p => p.id)
    expect(ids).toContain('pencil-rotring-600')
    expect(ids).toContain('digital-calipers-150mm')
    expect(ids).toContain('micrometer-0-25mm')
    expect(ids).toContain('gauge-block-20mm')
    expect(ids).toContain('gauge-block-50mm')
    expect(ids).toContain('pin-gauge-6mm')
    expect(ids).toContain('plug-gauge-gonogo')
    expect(ids).toContain('v-block-clamp')
    expect(ids).toContain('height-gauge-dial')

    // Every prop starts outside the 0.80m x 0.50m vellum sheet frame
    for (const p of snap.props) {
      const [x, y] = p.position
      expect(Math.abs(x) >= 0.404 || Math.abs(y) >= 0.254).toBe(true)
    }
    wb.dispose()
  })

  it('rolls the mechanical drafting pencil and plug pins and scoots gauge blocks, calipers, and micrometer on nudge', () => {
    const wb = createMetrologyWorkbenchProps()
    const camera = new PerspectiveCamera(34, 16 / 9, 0.001, 30)
    camera.position.set(0, 0, 0.85)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld(true)

    wb.update(makeFrame(0.25), context, camera)
    const before = wb.snapshot()
    const pencilBefore = before.props.find(p => p.id === 'pencil-rotring-600')!
    const pinBefore = before.props.find(p => p.id === 'pin-gauge-6mm')!
    const blockBefore = before.props.find(p => p.id === 'gauge-block-20mm')!
    const caliperBefore = before.props.find(p => p.id === 'digital-calipers-150mm')!

    expect(wb.nudgeProp('pencil-rotring-600', 0.02, -0.05, 0.2)).toBe(true)
    expect(wb.nudgeProp('pin-gauge-6mm', -0.01, -0.04, 0.15)).toBe(true)
    expect(wb.nudgeProp('gauge-block-20mm', 0.04, -0.03, 0.35)).toBe(true)
    expect(wb.nudgeProp('digital-calipers-150mm', 0.05, 0.03, -0.25)).toBe(true)

    for (let i = 0; i < 8; i++) wb.update(makeFrame(0.25), context, camera)
    const after = wb.snapshot()
    const pencilAfter = after.props.find(p => p.id === 'pencil-rotring-600')!
    const pinAfter = after.props.find(p => p.id === 'pin-gauge-6mm')!
    const blockAfter = after.props.find(p => p.id === 'gauge-block-20mm')!
    const caliperAfter = after.props.find(p => p.id === 'digital-calipers-150mm')!

    expect(pencilAfter.displacedMm).toBeGreaterThan(0.5)
    expect(Math.abs(pencilAfter.rollAngle - pencilBefore.rollAngle)).toBeGreaterThan(0.05)
    expect(pinAfter.displacedMm).toBeGreaterThan(0.5)
    expect(Math.abs(pinAfter.rollAngle - pinBefore.rollAngle)).toBeGreaterThan(0.05)
    expect(blockAfter.displacedMm).toBeGreaterThan(0.5)
    expect(Math.abs(blockAfter.rotationZ - blockBefore.rotationZ)).toBeGreaterThan(0.001)
    expect(caliperAfter.displacedMm).toBeGreaterThan(0.2)
    expect(Math.abs(caliperAfter.rotationZ - caliperBefore.rotationZ)).toBeGreaterThan(0.0005)

    wb.dispose()
  })

  it('hides props in drawing-edges proof mode and when sheet stock retires', () => {
    const wb = createMetrologyWorkbenchProps()
    const camera = new PerspectiveCamera(34, 16 / 9, 0.001, 30)
    wb.update(makeFrame(0.5, { proofMode: 'drawing-edges' }), context, camera)
    expect(wb.snapshot().visible).toBe(false)

    wb.update(makeFrame(1.0, { retirement: 1 }), context, camera)
    expect(wb.snapshot().visible).toBe(false)

    wb.update(makeFrame(0.5, { proofMode: 'normal', retirement: 0 }), context, camera)
    expect(wb.snapshot().visible).toBe(true)
    wb.dispose()
  })
})

