import type { Vector2, Vector3 } from 'three'
import { BREAKTHROUGH_FRAGMENT_LIFT_MAX, BREAKTHROUGH_FRAGMENT_LIFT_MIN } from '../drawing/sheet/breakthroughGeometry'

/**
 * Dome-shaped breakthrough debris (owner ruling 2026-10-22). Shards from the centre of the profile hole launch high
 * and keep a moderate lateral throw; shards near its edge throw outward on a flat trajectory. Per-shard variation
 * comes from the baked launch lift (`velocity.z`), so the cloud fills a volume instead of one flat sheet of paper.
 */
export const SHARD_PROFILE_HALF_X = 0.18
export const SHARD_PROFILE_HALF_Y = 0.11
/** Apex height range in metres: [min, max] at the centre and at the edge of the profile. */
export const SHARD_CENTER_APEX: readonly [number, number] = [0.22, 0.34]
export const SHARD_EDGE_APEX: readonly [number, number] = [0.03, 0.09]

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

export function shardApex(rNorm: number, liftT: number): number {
  const k = clamp01(rNorm)
  const shape = k * k * (3 - 2 * k)
  const lo = lerp(SHARD_CENTER_APEX[0], SHARD_EDGE_APEX[0], shape)
  const hi = lerp(SHARD_CENTER_APEX[1], SHARD_EDGE_APEX[1], shape)
  return lerp(lo, hi, clamp01(liftT))
}

export function createShardDome(fragments: readonly ShardSource[], primaryCenter: { x: number; y: number }): ShardDome[] {
  const raw = fragments.map(f => Math.hypot((f.center.x - primaryCenter.x) / SHARD_PROFILE_HALF_X, (f.center.y - primaryCenter.y) / SHARD_PROFILE_HALF_Y))
  return fragments.map((f, i) => {
    const rNorm = clamp01(raw[i])
    const liftT = (f.velocity.z - BREAKTHROUGH_FRAGMENT_LIFT_MIN) / (BREAKTHROUGH_FRAGMENT_LIFT_MAX - BREAKTHROUGH_FRAGMENT_LIFT_MIN)
    const speed = Math.hypot(f.velocity.x, f.velocity.y)
    // Outward direction from the profile centre; a shard sitting on the centre keeps its own baked azimuth.
    const dx = f.center.x - primaryCenter.x, dy = f.center.y - primaryCenter.y, d = Math.hypot(dx, dy)
    const ox = d > 1e-6 ? dx / d : f.velocity.x / Math.max(speed, 1e-6)
    const oy = d > 1e-6 ? dy / d : f.velocity.y / Math.max(speed, 1e-6)
    const weight = 0.25 + 0.75 * rNorm
    let dirX = lerp(f.velocity.x / Math.max(speed, 1e-6), ox, weight)
    let dirY = lerp(f.velocity.y / Math.max(speed, 1e-6), oy, weight)
    const n = Math.hypot(dirX, dirY)
    if (n > 1e-6) { dirX /= n; dirY /= n }
    const throwSpeed = speed * (0.8 + 0.5 * rNorm)
    return { rNorm, apex: shardApex(rNorm, liftT), vx: dirX * throwSpeed, vy: dirY * throwSpeed }
  })
}
