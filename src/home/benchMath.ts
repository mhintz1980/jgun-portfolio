// Pure math for the homepage model bench: camera fit, drag inertia and the rotation detents.
// Kept free of three.js so it can be unit-tested in node.

/** One detent of the turntable, in radians (15 degrees, like an indexing head). */
export const DETENT = Math.PI / 12

/** Camera distance at which a sphere of `radius` fits the view in both directions. */
export function fitDistance(radius: number, fovDeg: number, aspect: number, margin = 1.15): number {
  if (!(radius > 0) || !(fovDeg > 0) || !(aspect > 0)) return 1
  const vertical = (fovDeg * Math.PI) / 360
  const horizontal = Math.atan(Math.tan(vertical) * aspect)
  return (radius * margin) / Math.sin(Math.min(vertical, horizontal))
}

/** Nearest detent to an angle. */
export function nearestDetent(angle: number, step = DETENT): number {
  return Math.round(angle / step) * step
}

export interface SpinState {
  angle: number
  velocity: number
}

/**
 * Advances a released turntable by `dt` seconds: it coasts with friction, and once slow it is
 * pulled into the nearest detent. Returns the new state and whether it has come to rest.
 */
export function stepSpin(state: SpinState, dt: number, friction = 4.5, catchSpeed = 0.9): SpinState & { resting: boolean } {
  const step = Math.min(Math.max(dt, 0), 0.05)
  let { angle, velocity } = state
  if (Math.abs(velocity) > catchSpeed) {
    velocity *= Math.exp(-friction * step)
    angle += velocity * step
    return { angle, velocity, resting: false }
  }
  const target = nearestDetent(angle)
  const gap = target - angle
  if (Math.abs(gap) < 0.0005) return { angle: target, velocity: 0, resting: true }
  // Critically damped pull into the notch: fast at first, no overshoot.
  angle += gap * (1 - Math.exp(-14 * step))
  return { angle, velocity: 0, resting: false }
}

/** Clamps the tilt so the model never flips or goes edge-on. */
export function clampTilt(tilt: number, min = -0.15, max = 0.9): number {
  return Math.min(max, Math.max(min, tilt))
}
