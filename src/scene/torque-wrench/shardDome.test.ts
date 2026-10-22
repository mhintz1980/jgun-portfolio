import { describe, expect, it } from 'vitest'
import { Vector2, Vector3 } from 'three'
import { createShardDome, shardApex, SHARD_CENTER_APEX, SHARD_EDGE_APEX, SHARD_PROFILE_HALF_X } from './shardDome'

const shard = (x: number, y: number, vz = 0.85) => ({ center: new Vector2(x, y), velocity: new Vector3(0.5, 0, vz) })

describe('shard dome', () => {
  it('launches centre shards high and edge shards flat', () => {
    const dome = createShardDome([shard(0, 0), shard(SHARD_PROFILE_HALF_X, 0)], { x: 0, y: 0 })
    expect(dome[0].apex).toBeGreaterThanOrEqual(SHARD_CENTER_APEX[0])
    expect(dome[0].apex).toBeLessThanOrEqual(SHARD_CENTER_APEX[1])
    expect(dome[1].apex).toBeGreaterThanOrEqual(SHARD_EDGE_APEX[0])
    expect(dome[1].apex).toBeLessThanOrEqual(SHARD_EDGE_APEX[1])
  })
  it('apex falls monotonically with radius and varies with the baked lift', () => {
    for (let r = 0; r < 1; r += 0.05) expect(shardApex(r + 0.05, 0.5)).toBeLessThanOrEqual(shardApex(r, 0.5) + 1e-12)
    expect(shardApex(0.5, 1)).toBeGreaterThan(shardApex(0.5, 0))
  })
  it('turns edge shards radially outward and keeps a throw for centre shards', () => {
    const dome = createShardDome([shard(0.18, 0), shard(0, 0)], { x: 0, y: 0 })
    expect(dome[0].vx).toBeGreaterThan(0)
    expect(Math.abs(dome[0].vy)).toBeLessThan(1e-9)
    expect(Math.hypot(dome[1].vx, dome[1].vy)).toBeGreaterThan(0.3)
  })
  it('is deterministic', () => {
    const a = createShardDome([shard(0.05, 0.03)], { x: 0, y: 0 }), b = createShardDome([shard(0.05, 0.03)], { x: 0, y: 0 })
    expect(a).toEqual(b)
  })
})
