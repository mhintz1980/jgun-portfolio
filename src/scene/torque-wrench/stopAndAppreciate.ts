import { Quaternion, Vector3 } from 'three'
import { createCameraHandoff, type CameraHandoffPose } from './CameraHandoff'

export const PASSIVE_LOOK_MAX_DEG = 25
export const PASSIVE_LOOK_MAX_RAD = (PASSIVE_LOOK_MAX_DEG * Math.PI) / 180
export const FREE_LOOK_MAX_PITCH_RAD = (75 * Math.PI) / 180
export const WHIP_BACK_DURATION_SEC = 0.6
export const WHEEL_RESUME_THRESHOLD_PX = 80
export const SCROLL_STATIONARY_DELAY_SEC = 0.12
export const REGISTRATION_GUARD_START = 0.265
export const REGISTRATION_GUARD_END = 0.32

export interface SecondOrderDynamicsState {
  readonly f: number
  readonly z: number
  readonly r: number
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  update(dt: number, targetX: number, targetY: number): { x: number; y: number; vx: number; vy: number }
  reset(x?: number, y?: number): void
}

/**
 * Oryzo / t3ssel8r SecondOrderDynamics formulation:
 * f = natural frequency (Hz), z = damping ratio, r = initial response.
 * Default pointer feel constants: f = 1.35, z = 0.5, r = 1.25.
 */
export function createSecondOrderDynamics(f = 1.35, z = 0.5, r = 1.25, x0 = 0, y0 = 0): SecondOrderDynamicsState {
  if (!Number.isFinite(f) || f <= 0 || !Number.isFinite(z) || !Number.isFinite(r)) {
    throw new RangeError('SecondOrderDynamics parameters must be finite with f > 0')
  }
  const w = 2 * Math.PI * f
  const k1 = z / (Math.PI * f)
  const k2 = 1 / (w * w)
  const k3 = (r * z) / w

  let xp = x0
  let yp = y0
  let px = x0
  let py = y0
  let vx = 0
  let vy = 0

  return {
    f,
    z,
    r,
    get x() { return px },
    get y() { return py },
    get vx() { return vx },
    get vy() { return vy },
    update(dt: number, targetX: number, targetY: number) {
      if (!Number.isFinite(dt) || dt <= 0) return { x: px, y: py, vx, vy }
      const step = Math.min(Math.max(dt, 1e-4), 0.1)
      const xd = (targetX - xp) / step
      const yd = (targetY - yp) / step
      xp = targetX
      yp = targetY
      const k2Stable = Math.max(k2, (step * step) / 2 + (step * k1) / 2, step * k1)
      px += step * vx
      py += step * vy
      vx += (step * (targetX + k3 * xd - px - k1 * vx)) / k2Stable
      vy += (step * (targetY + k3 * yd - py - k1 * vy)) / k2Stable
      return { x: px, y: py, vx, vy }
    },
    reset(x = 0, y = 0) {
      xp = x; yp = y; px = x; py = y; vx = 0; vy = 0
    },
  }
}

export interface StopAndAppreciateTelemetry {
  mode: 'idle' | 'passive' | 'free-look' | 'whip-back'
  freeLookActive: boolean
  whipBackActive: boolean
  whipBackProgress: number
  passiveWeight: number
  yawDeg: number
  pitchDeg: number
  frozenProgress: number | null
  wheelAccumPx: number
}

export interface StopAndAppreciateController {
  readonly dynamics: SecondOrderDynamicsState
  resolveProgress(storeProgress: number): number
  setPointerNormalized(nx: number, ny: number): void
  beginPointerDrag(clientX: number, clientY: number): void
  movePointerDrag(clientX: number, clientY: number, viewportWidth: number, viewportHeight: number): void
  endPointerDrag(): void
  nudgeOrbit(deltaYawRad: number, deltaPitchRad: number): void
  onWheelDelta(deltaY: number): boolean
  toggleFreeLook(force?: boolean, currentProgress?: number): boolean
  applyCamera(dt: number, progress: number, pose: CameraHandoffPose, outTelemetry?: StopAndAppreciateTelemetry): CameraHandoffPose
  snapshot(): StopAndAppreciateTelemetry
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const RAD_TO_DEG = 180 / Math.PI

/**
 * Deflect a camera position around its look target using camera-local yaw (around orthogonalized up)
 * and pitch (around right axis), preserving target distance and avoiding gimbal collapse.
 */
export function deflectCameraAroundTarget(
  pose: CameraHandoffPose,
  yawRad: number,
  pitchRad: number,
  qYaw: Quaternion,
  qPitch: Quaternion,
  offset: Vector3,
  forward: Vector3,
  right: Vector3,
  orthoUp: Vector3,
): void {
  if (Math.abs(yawRad) < 1e-7 && Math.abs(pitchRad) < 1e-7) return
  offset.subVectors(pose.position, pose.target)
  const dist = offset.length()
  if (dist < 1e-6) return
  forward.copy(offset).multiplyScalar(-1 / dist)
  right.crossVectors(forward, pose.up)
  if (right.lengthSq() < 1e-6) right.set(1, 0, 0)
  else right.normalize()
  orthoUp.crossVectors(right, forward).normalize()

  qYaw.setFromAxisAngle(orthoUp, yawRad)
  qPitch.setFromAxisAngle(right, pitchRad)
  qYaw.multiply(qPitch)

  offset.applyQuaternion(qYaw).setLength(dist)
  pose.position.addVectors(pose.target, offset)
  pose.up.copy(orthoUp).applyQuaternion(qYaw).normalize()
}

export function createStopAndAppreciateController(): StopAndAppreciateController {
  const dynamics = createSecondOrderDynamics(1.35, 0.5, 1.25)
  const blendCamera = createCameraHandoff()

  let pointerX = 0
  let pointerY = 0
  let pointerMoved = false
  let lastProgress: number | null = null
  let idleHoldSec = 0
  let passiveWeight = 0

  let freeLookActive = false
  let frozenProgress: number | null = null
  let dragging = false
  let dragLastX = 0
  let dragLastY = 0
  let orbitYaw = 0
  let orbitPitch = 0
  let wheelAccumPx = 0

  let whipBackActive = false
  let whipBackElapsed = 0
  const lastAppliedPose: CameraHandoffPose = {
    position: new Vector3(),
    target: new Vector3(),
    up: new Vector3(0, 1, 0),
    fov: 42,
  }
  const whipBackFrom: CameraHandoffPose = {
    position: new Vector3(),
    target: new Vector3(),
    up: new Vector3(0, 1, 0),
    fov: 42,
  }
  const whipBackResult: CameraHandoffPose = {
    position: new Vector3(),
    target: new Vector3(),
    up: new Vector3(0, 1, 0),
    fov: 42,
  }
  let hasAppliedPose = false

  const qYaw = new Quaternion()
  const qPitch = new Quaternion()
  const offset = new Vector3()
  const forward = new Vector3()
  const right = new Vector3()
  const orthoUp = new Vector3()

  const telemetry: StopAndAppreciateTelemetry = {
    mode: 'idle',
    freeLookActive: false,
    whipBackActive: false,
    whipBackProgress: 1,
    passiveWeight: 0,
    yawDeg: 0,
    pitchDeg: 0,
    frozenProgress: null,
    wheelAccumPx: 0,
  }

  function exitFreeLookWithWhipBack(): void {
    if (!freeLookActive) return
    freeLookActive = false
    frozenProgress = null
    dragging = false
    wheelAccumPx = 0
    orbitYaw = 0
    orbitPitch = 0
    passiveWeight = 0
    dynamics.reset(0, 0)
    if (hasAppliedPose) {
      whipBackFrom.position.copy(lastAppliedPose.position)
      whipBackFrom.target.copy(lastAppliedPose.target)
      whipBackFrom.up.copy(lastAppliedPose.up)
      whipBackFrom.fov = lastAppliedPose.fov
      whipBackActive = true
      whipBackElapsed = 0
    }
    telemetry.freeLookActive = false
    telemetry.whipBackActive = whipBackActive
    telemetry.whipBackProgress = whipBackActive ? 0 : 1
    telemetry.frozenProgress = null
    telemetry.wheelAccumPx = 0
    telemetry.mode = whipBackActive ? 'whip-back' : 'idle'
  }

  return {
    dynamics,
    resolveProgress(storeProgress: number): number {
      if (freeLookActive && frozenProgress !== null) return frozenProgress
      return storeProgress
    },
    setPointerNormalized(nx: number, ny: number): void {
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) return
      pointerX = clamp(nx, -1, 1)
      pointerY = clamp(ny, -1, 1)
      pointerMoved = true
    },
    beginPointerDrag(clientX: number, clientY: number): void {
      if (!freeLookActive) return
      dragging = true
      dragLastX = clientX
      dragLastY = clientY
    },
    movePointerDrag(clientX: number, clientY: number, viewportWidth: number, viewportHeight: number): void {
      if (!freeLookActive || !dragging) return
      const dx = (clientX - dragLastX) / Math.max(1, viewportWidth)
      const dy = (clientY - dragLastY) / Math.max(1, viewportHeight)
      dragLastX = clientX
      dragLastY = clientY
      orbitYaw -= dx * Math.PI * 1.5
      orbitPitch = clamp(orbitPitch + dy * Math.PI, -FREE_LOOK_MAX_PITCH_RAD, FREE_LOOK_MAX_PITCH_RAD)
    },
    endPointerDrag(): void {
      dragging = false
    },
    nudgeOrbit(deltaYawRad: number, deltaPitchRad: number): void {
      if (!freeLookActive) return
      orbitYaw += deltaYawRad
      orbitPitch = clamp(orbitPitch + deltaPitchRad, -FREE_LOOK_MAX_PITCH_RAD, FREE_LOOK_MAX_PITCH_RAD)
    },
    onWheelDelta(deltaY: number): boolean {
      if (!freeLookActive || !Number.isFinite(deltaY)) return false
      wheelAccumPx += Math.abs(deltaY)
      telemetry.wheelAccumPx = wheelAccumPx
      if (wheelAccumPx > WHEEL_RESUME_THRESHOLD_PX) {
        exitFreeLookWithWhipBack()
        return true
      }
      return false
    },
    toggleFreeLook(force?: boolean, currentProgress?: number): boolean {
      const next = force ?? !freeLookActive
      if (next === freeLookActive) return freeLookActive
      if (next) {
        freeLookActive = true
        whipBackActive = false
        whipBackElapsed = 0
        frozenProgress = currentProgress ?? lastProgress ?? 0
        // Give a subtle initial 12-degree inspection nudge on entry if stationary at 0 so pressing F has immediate visual feedback
        const currentYaw = (dynamics.x * PASSIVE_LOOK_MAX_RAD * passiveWeight) * -1
        const currentPitch = dynamics.y * PASSIVE_LOOK_MAX_RAD * passiveWeight
        orbitYaw = Math.abs(currentYaw) > 0.02 ? currentYaw : -0.21
        orbitPitch = Math.abs(currentPitch) > 0.02 ? currentPitch : 0.12
        wheelAccumPx = 0
        dragging = false
      } else {
        exitFreeLookWithWhipBack()
      }
      telemetry.freeLookActive = freeLookActive
      telemetry.whipBackActive = whipBackActive
      telemetry.frozenProgress = frozenProgress
      return freeLookActive
    },
    applyCamera(dt: number, progress: number, pose: CameraHandoffPose, outTelemetry?: StopAndAppreciateTelemetry): CameraHandoffPose {
      const step = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.1) : 0
      const scrolling = lastProgress !== null && Math.abs(progress - lastProgress) > 1e-6
      lastProgress = progress

      let yaw = 0
      let pitch = 0

      if (freeLookActive) {
        // Mode B: Active Free Look around the current subject target (both pointer hover look and click-drag 360 orbit).
        const dyn = dynamics.update(step, pointerMoved ? pointerX : 0, pointerMoved ? pointerY : 0)
        yaw = orbitYaw - dyn.x * PASSIVE_LOOK_MAX_RAD * 1.4
        pitch = clamp(orbitPitch + dyn.y * PASSIVE_LOOK_MAX_RAD * 1.1, -FREE_LOOK_MAX_PITCH_RAD, FREE_LOOK_MAX_PITCH_RAD)
        deflectCameraAroundTarget(pose, yaw, pitch, qYaw, qPitch, offset, forward, right, orthoUp)
        telemetry.mode = 'free-look'
        telemetry.whipBackProgress = 0
      } else if (whipBackActive) {
        // Mode B exit: 0.6s quintic whip-back slerp to the live authored narrative camera pose.
        whipBackElapsed = Math.min(WHIP_BACK_DURATION_SEC, whipBackElapsed + step)
        blendCamera(whipBackFrom, pose, whipBackElapsed, 0, WHIP_BACK_DURATION_SEC, whipBackResult)
        pose.position.copy(whipBackResult.position)
        pose.target.copy(whipBackResult.target)
        pose.up.copy(whipBackResult.up)
        pose.fov = whipBackResult.fov
        const u = whipBackElapsed / WHIP_BACK_DURATION_SEC
        telemetry.whipBackProgress = u * u * u * (10 + u * (-15 + 6 * u))
        if (whipBackElapsed >= WHIP_BACK_DURATION_SEC - 1e-7) {
          whipBackActive = false
          telemetry.whipBackProgress = 1
        }
        telemetry.mode = whipBackActive ? 'whip-back' : 'idle'
      } else {
        // Mode A: Passive SecondOrderDynamics pointer look (±25° cone when scroll is stationary, fading to 0 on scroll).
        const inRegistrationHold = progress >= REGISTRATION_GUARD_START && progress <= REGISTRATION_GUARD_END
        if (scrolling || inRegistrationHold || !pointerMoved) {
          if (scrolling) idleHoldSec = 0
          passiveWeight *= Math.exp(-16 * step)
          if (passiveWeight < 1e-4) passiveWeight = 0
        } else {
          idleHoldSec += step
          if (idleHoldSec >= SCROLL_STATIONARY_DELAY_SEC) {
            passiveWeight += (1 - passiveWeight) * (1 - Math.exp(-8 * step))
          }
        }
        const dyn = dynamics.update(step, pointerMoved ? pointerX * passiveWeight : 0, pointerMoved ? pointerY * passiveWeight : 0)
        yaw = -dyn.x * PASSIVE_LOOK_MAX_RAD * passiveWeight
        pitch = dyn.y * PASSIVE_LOOK_MAX_RAD * passiveWeight
        const coneMag = Math.hypot(yaw, pitch)
        if (coneMag > PASSIVE_LOOK_MAX_RAD) {
          const scale = PASSIVE_LOOK_MAX_RAD / coneMag
          yaw *= scale
          pitch *= scale
        }
        if (passiveWeight > 1e-4 && coneMag > 1e-6) {
          deflectCameraAroundTarget(pose, yaw, pitch, qYaw, qPitch, offset, forward, right, orthoUp)
          telemetry.mode = 'passive'
        } else {
          telemetry.mode = 'idle'
        }
        telemetry.whipBackProgress = 1
      }

      lastAppliedPose.position.copy(pose.position)
      lastAppliedPose.target.copy(pose.target)
      lastAppliedPose.up.copy(pose.up)
      lastAppliedPose.fov = pose.fov
      hasAppliedPose = true

      telemetry.freeLookActive = freeLookActive
      telemetry.whipBackActive = whipBackActive
      telemetry.passiveWeight = passiveWeight
      telemetry.yawDeg = yaw * RAD_TO_DEG
      telemetry.pitchDeg = pitch * RAD_TO_DEG
      telemetry.frozenProgress = frozenProgress
      telemetry.wheelAccumPx = wheelAccumPx

      if (outTelemetry) Object.assign(outTelemetry, telemetry)
      return pose
    },
    snapshot(): StopAndAppreciateTelemetry {
      return { ...telemetry }
    },
  }
}
