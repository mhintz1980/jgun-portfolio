import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import {
  createSecondOrderDynamics,
  createStopAndAppreciateController,
  PASSIVE_LOOK_MAX_DEG,
  WHEEL_RESUME_THRESHOLD_PX,
  WHIP_BACK_DURATION_SEC,
} from './stopAndAppreciate'
import type { CameraHandoffPose } from './CameraHandoff'

function makePose(): CameraHandoffPose {
  return {
    position: new Vector3(0, 0, 1),
    target: new Vector3(0, 0, 0),
    up: new Vector3(0, 1, 0),
    fov: 42,
  }
}

describe('SecondOrderDynamics (1.35, 0.5, 1.25)', () => {
  it('exhibits underdamped response and converges cleanly to the target', () => {
    const dyn = createSecondOrderDynamics(1.35, 0.5, 1.25)
    let peak = 0
    for (let i = 0; i < 180; i++) {
      const { x } = dyn.update(1 / 60, 1, 0)
      peak = Math.max(peak, x)
    }
    // Underdamped (z = 0.5, r = 1.25) overshoots 1.0 slightly before settling to 1.0
    expect(peak).toBeGreaterThan(1.02)
    expect(dyn.x).toBeCloseTo(1, 2)
    expect(Math.abs(dyn.vx)).toBeLessThan(0.01)
  })

  it('remains stable under large frame delta spikes', () => {
    const dyn = createSecondOrderDynamics(1.35, 0.5, 1.25)
    const res = dyn.update(0.5, 1, -1)
    expect(Number.isFinite(res.x)).toBe(true)
    expect(Number.isFinite(res.y)).toBe(true)
  })
})

describe('Stop and Appreciate Camera Controller', () => {
  it('produces zero deflection when pointer has not moved (headless census safety)', () => {
    const ctrl = createStopAndAppreciateController()
    const pose = makePose()
    for (let i = 0; i < 30; i++) ctrl.applyCamera(1 / 60, 0.52, pose)
    expect(pose.position.toArray()).toEqual([0, 0, 1])
    expect(ctrl.snapshot().mode).toBe('idle')
  })

  it('Mode A: deflects within the ±25 deg cone when stationary and fades to 0 during scroll', () => {
    const ctrl = createStopAndAppreciateController()
    ctrl.setPointerNormalized(1, 1)

    // Hold scroll stationary at p = 0.52 for 1.5s
    let pose = makePose()
    for (let i = 0; i < 90; i++) {
      pose = makePose()
      ctrl.applyCamera(1 / 60, 0.52, pose)
    }
    const snapStationary = ctrl.snapshot()
    expect(snapStationary.mode).toBe('passive')
    expect(snapStationary.passiveWeight).toBeGreaterThan(0.95)
    const totalConeDeg = Math.hypot(snapStationary.yawDeg, snapStationary.pitchDeg)
    expect(totalConeDeg).toBeGreaterThan(10)
    expect(totalConeDeg).toBeLessThanOrEqual(PASSIVE_LOOK_MAX_DEG + 1e-4)
    expect(pose.position.distanceTo(pose.target)).toBeCloseTo(1, 6)

    // Resume scrolling: passiveWeight and deflection decay back to 0
    let p = 0.52
    for (let i = 0; i < 60; i++) {
      p += 0.002
      pose = makePose()
      ctrl.applyCamera(1 / 60, p, pose)
    }
    const snapScrolling = ctrl.snapshot()
    expect(snapScrolling.passiveWeight).toBeLessThan(1e-3)
    expect(pose.position.distanceTo(new Vector3(0, 0, 1))).toBeLessThan(1e-3)
  })

  it('Mode B: freezes scroll progress in Free Look, orbits around target, and executes a 0.6s quintic whip-back on wheel resume', () => {
    const ctrl = createStopAndAppreciateController()
    ctrl.applyCamera(1 / 60, 0.65, makePose())

    // Toggle Free Look ON at p = 0.65
    expect(ctrl.toggleFreeLook(true, 0.65)).toBe(true)
    expect(ctrl.resolveProgress(0.8)).toBe(0.65)

    // Drag to orbit camera
    ctrl.beginPointerDrag(500, 450)
    ctrl.movePointerDrag(680, 360, 1440, 900)
    ctrl.endPointerDrag()

    const freePose = makePose()
    ctrl.applyCamera(1 / 60, ctrl.resolveProgress(0.8), freePose)
    expect(ctrl.snapshot().mode).toBe('free-look')
    expect(freePose.position.distanceTo(new Vector3(0, 0, 1))).toBeGreaterThan(0.2)
    expect(freePose.position.distanceTo(freePose.target)).toBeCloseTo(1, 6)

    // Small wheel delta below threshold keeps Free Look active
    expect(ctrl.onWheelDelta(WHEEL_RESUME_THRESHOLD_PX * 0.5)).toBe(false)
    expect(ctrl.snapshot().freeLookActive).toBe(true)

    // Exceeding wheel threshold (> 80px) triggers automatic 0.6s quintic whip-back and unlocks scroll
    expect(ctrl.onWheelDelta(WHEEL_RESUME_THRESHOLD_PX * 0.6)).toBe(true)
    expect(ctrl.snapshot().freeLookActive).toBe(false)
    expect(ctrl.snapshot().whipBackActive).toBe(true)
    expect(ctrl.resolveProgress(0.8)).toBe(0.8)

    // Midpoint (0.3s of 0.6s at 60 fps = 18 frames): quintic progress is 0.5
    let midPose = makePose()
    for (let i = 0; i < 18; i++) {
      midPose = makePose()
      ctrl.applyCamera(WHIP_BACK_DURATION_SEC / 36, 0.8, midPose)
    }
    expect(ctrl.snapshot().mode).toBe('whip-back')
    expect(ctrl.snapshot().whipBackProgress).toBeCloseTo(0.5, 5)

    // Completion (0.6s total = 18 more frames): camera is back on the authored narrative pose
    let finalPose = makePose()
    for (let i = 0; i < 18; i++) {
      finalPose = makePose()
      ctrl.applyCamera(WHIP_BACK_DURATION_SEC / 36, 0.8, finalPose)
    }
    expect(ctrl.snapshot().whipBackActive).toBe(false)
    expect(ctrl.snapshot().whipBackProgress).toBe(1)
    expect(finalPose.position.distanceTo(new Vector3(0, 0, 1))).toBeLessThan(1e-6)
  })
})
