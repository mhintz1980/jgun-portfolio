import type { Vector2, Vector3 } from 'three'
import { BREAKTHROUGH_FRAGMENT_LIFT_MAX, BREAKTHROUGH_FRAGMENT_LIFT_MIN } from '../drawing/sheet/breakthroughGeometry'

/**
 * Dome-shaped shockwave breakthrough debris. Shards from the centre of the profile hole launch high
 * and keep a strong lateral throw; shards near its edge blast outward across a 3D shockwave shell.
 * Per-shard variation comes from the baked launch velocity (`velocity.x/y/z`), stratified into three
 * radial/axial depth waves (vanguard past the camera, near-miss orbit ring, and inner approaching cloud)
 * so the 360° bullet-time camera orbit looks through a dense field of debris from every angle and
 * the post-bullet-time release races past the camera without falling back onto the drawing.
 */
export const SHARD_PROFILE_HALF_X = 0.18
export const SHARD_PROFILE_HALF_Y = 0.11
/** Apex height range in metres: [min, max] at the centre and at the edge of the profile. */
export const SHARD_CENTER_APEX: readonly [number, number] = [0.27, 0.40]
export const SHARD_EDGE_APEX: readonly [number, number] = [0.09, 0.18]

export interface ShardDome {
  /** 0 at the profile centre, 1 on or beyond the profile half-extents. */
  rNorm: number
  /** Peak height above the sheet in metres. */
  apex: number
  /** Lateral launch velocity (sheet metres per unit flight), already blended toward radially outward. */
  vx: number
  vy: number
}

interface ShardSource { center: Vector2 | Vector3; velocity: Vector3 }

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** Deterministic unit hash in [0, 1) for wave stratification without external state. */
function hashWave(seed: number): number {
  let x = seed | 0
  x = Math.imul(x ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

export function shardApex(rNorm: number, liftT: number): number {
  const k = clamp01(rNorm)
  const shape = k * k * (3 - 2 * k)
  const lo = lerp(SHARD_CENTER_APEX[0], SHARD_EDGE_APEX[0], shape)
  const hi = lerp(SHARD_CENTER_APEX[1], SHARD_EDGE_APEX[1], shape)
  return lerp(lo, hi, clamp01(liftT))
}

/**
 * Authored sheet-local camera orbit corridor during the 360° bullet-time sweep (p = 0.43..0.452).
 * Given azimuth theta (radians) around primaryCenter, returns [radiusM, heightM] of the camera lens
 * in sheet-local coordinates so near-miss shards can thread right across the camera frustum.
 */
function orbitCorridorAtAzimuth(theta: number): readonly [number, number] {
  const s = Math.sin(theta)
  const c = Math.cos(theta)
  const r = Math.max(0.28, Math.min(0.60, 0.39 - 0.105 * c - 0.045 * s + 0.035 * Math.cos(2 * theta - 0.5)))
  const z = Math.max(0.11, Math.min(0.24, 0.165 - 0.048 * c - 0.022 * s))
  return [r, z]
}

export function createShardDome(fragments: readonly ShardSource[], primaryCenter: { x: number; y: number }): ShardDome[] {
  const raw = fragments.map(f => Math.hypot((f.center.x - primaryCenter.x) / SHARD_PROFILE_HALF_X, (f.center.y - primaryCenter.y) / SHARD_PROFILE_HALF_Y))
  const nTotal = fragments.length
  const GOLDEN_ANGLE = 2.39996322972865332
  return fragments.map((f, i) => {
    const rNorm = clamp01(raw[i])
    const liftT = clamp01((f.velocity.z - BREAKTHROUGH_FRAGMENT_LIFT_MIN) / (BREAKTHROUGH_FRAGMENT_LIFT_MAX - BREAKTHROUGH_FRAGMENT_LIFT_MIN))
    const speed = Math.hypot(f.velocity.x, f.velocity.y)
    const nx = (f.center.x - primaryCenter.x) / SHARD_PROFILE_HALF_X
    const ny = (f.center.y - primaryCenter.y) / SHARD_PROFILE_HALF_Y
    const nd = Math.hypot(nx, ny)
    const bx = f.velocity.x / Math.max(speed, 1e-6)
    const by = f.velocity.y / Math.max(speed, 1e-6)
    const ox = nd > 1e-6 ? nx / nd : bx
    const oy = nd > 1e-6 ? ny / nd : by
    const weight = 0.35 + 0.65 * rNorm
    let dirX = lerp(bx, ox, weight)
    let dirY = lerp(by, oy, weight)
    const n = Math.hypot(dirX, dirY)
    if (n > 1e-6) { dirX /= n; dirY /= n }

    if (nTotal <= 4) {
      const throwSpeed = Math.max(speed, 0.45) * (0.95 + 0.55 * rNorm)
      return { rNorm, apex: shardApex(rNorm, liftT), vx: dirX * throwSpeed, vy: dirY * throwSpeed }
    }

    // For the full shatter cloud (> 4 shards), distribute azimuths around 360° blended with
    // natural outward radial direction so every camera angle in the 360° orbit sees a dense
    // field of debris, near-miss close calls right in front of the lens, and outer vanguard shards.
    const j1 = hashWave(i * 73 + 19)
    const j2 = hashWave(i * 199 + 53)
    const j3 = hashWave(i * 317 + 101)
    const naturalTheta = Math.atan2(dirY, dirX)
    const goldenTheta = ((i * GOLDEN_ANGLE) % (Math.PI * 2)) - Math.PI
    // Wrap-safe blend toward golden-angle 360° coverage while preserving outward explosion sense
    const deltaTheta = Math.atan2(Math.sin(goldenTheta - naturalTheta), Math.cos(goldenTheta - naturalTheta))
    const theta = naturalTheta + deltaTheta * (0.72 + 0.22 * j1)
    const ux = Math.cos(theta)
    const uy = Math.sin(theta)
    const [camR, camZ] = orbitCorridorAtAzimuth(theta)
    // Mean radial/vertical drive factor during the bullet-time orbit plateau (p = 0.43..0.452)
    const midDrive = 0.72 + 0.08 * j2
    // The camera target in sheet-local coordinates sits at z ~ 0.04..0.065 m above the sheet
    // while the camera lens orbits at z = camZ (0.11..0.24 m) and radius = camR (0.30..0.60 m).
    // Any shard at radius r lies directly on the camera's optical axis when its height is:
    const sightlineZ = (r: number) => 0.052 + (camZ - 0.052) * (r / Math.max(camR, 0.22))

    const role = i % 5
    let targetR: number
    let targetZ: number
    if (role === 0 || role === 1) {
      // Near-miss grazing shell: sits 3.5 cm to 11 cm directly in front of the camera lens
      // right inside its 30-42 deg view frustum!
      const frontOffset = lerp(0.035, 0.11, j1)
      targetR = Math.max(0.15, camR - frontOffset)
      targetZ = Math.max(0.048, sightlineZ(targetR) + lerp(-0.015, 0.016, j3 - 0.5 + 0.3 * (liftT - 0.5)))
    } else if (role === 2) {
      // Dense mid-field debris right along the sightline between the camera and the wrench:
      targetR = lerp(0.10, Math.max(0.20, camR - 0.11), j1)
      targetZ = Math.max(0.042, sightlineZ(targetR) + lerp(-0.024, 0.028, 0.5 * liftT + 0.5 * j3))
    } else {
      // Outer shockwave vanguard (roles 3 & 4): already blasted past the camera orbit when bullet-time
      // starts (r > startCamRadius ~ 0.60 m), and visible behind the wrench across the 360° chord!
      targetR = Math.max(camR + lerp(0.18, 0.48, j1), lerp(0.72, 1.08, j1))
      targetZ = lerp(0.06, 0.24, 0.5 * liftT + 0.5 * j3)
    }

    const targetX = primaryCenter.x + ux * targetR
    const targetY = primaryCenter.y + uy * targetR
    const vx = (targetX - f.center.x) / midDrive
    const vy = (targetY - f.center.y) / midDrive
    const apex = Math.max(0.08, targetZ / midDrive)
    return { rNorm, apex, vx, vy }
  })
}
