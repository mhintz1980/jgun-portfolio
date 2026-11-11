import { describe, expect, it } from 'vitest'
import { Box3, Matrix4, Vector2, Vector3 } from 'three'
// @ts-ignore — node builtins for loading the real tracked profile contour.
import { gunzipSync } from 'node:zlib'
// @ts-ignore
import { readFileSync } from 'node:fs'
// @ts-ignore
import { fileURLToPath } from 'node:url'
import { createShardDome, shardApex, SHARD_CENTER_APEX, SHARD_EDGE_APEX, SHARD_PROFILE_HALF_X } from './shardDome'
import { makeBreakthroughGeometry } from '../drawing/sheet/breakthroughGeometry'
import { makeDrawingLayout, SHEET_HEIGHT, SHEET_ROTATION, SHEET_WIDTH } from '../drawing/drawingGeometry'
import { INTRO_PHASES, smooth01 } from '../drawing/introTimeline'
import { breakthroughSubjectTimeAt, sampleOpening } from './OpeningDirector'
import { sampleOpeningCamera, SHATTER_ORBIT_END, SHATTER_ORBIT_START } from './OpeningCamera'
import type { SheetCameraPose } from '../drawing/sheetCamera'

const shard = (x: number, y: number, vz = 1.025) => ({ center: new Vector2(x, y), velocity: new Vector3(0.5, 0, vz) })

function loadTrackedProfile(): number[][] {
  const url = new URL('../../../public/drawing/jgun-sheet-v2.bin.gz', import.meta.url)
  const bytes = gunzipSync(readFileSync(fileURLToPath(url)))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const segNumbers = view.getUint32(12, true)
  const fillNumbers = view.getUint32(16, true)
  const profilePoints = view.getUint32(20, true)
  const sidecarBytes = view.getUint32(24, true)
  const start = ((28 + sidecarBytes + 7) & ~7) + (segNumbers + fillNumbers) * 8
  const points: number[][] = []
  for (let i = 0; i < profilePoints; i += 1) {
    points.push([view.getFloat64(start + i * 16, true), view.getFloat64(start + i * 16 + 8, true)])
  }
  return points
}

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

  it('surrounds the 360° bullet-time camera orbit with past-camera, near-miss, and approaching shards, then blasts past the camera without falling on the sheet', () => {
    const baked = makeBreakthroughGeometry(loadTrackedProfile(), SHEET_WIDTH, SHEET_HEIGHT)
    try {
      expect(baked.fragments.length).toBeGreaterThan(120)
      const cx = baked.fragments.reduce((s, f) => s + f.center.x, 0) / baked.fragments.length
      const cy = baked.fragments.reduce((s, f) => s + f.center.y, 0) / baked.fragments.length
      const primaryCenter = { x: cx, y: cy }
      const domes = createShardDome(baked.fragments, primaryCenter)
      const layout = makeDrawingLayout(1440 / 900, new Box3(new Vector3(-0.2, -0.06, -0.04), new Vector3(0.2, 0.06, 0.04)))
      layout.primaryCenter.set(cx, cy, 0)
      const cam: SheetCameraPose = { position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 }

      const shardPos = (i: number, t: number): Vector3 => {
        const f = baked.fragments[i], d = domes[i]
        const e = Math.max(0, Math.min(1, ((t - INTRO_PHASES.fractureStart)
          / (INTRO_PHASES.fractureEnd - INTRO_PHASES.fractureStart) - f.delay) / (1 - f.delay)))
        const smooth = e * e * (3 - 2 * e)
        const shock = 1 - Math.pow(1 - smooth, 2.2)
        const surgeU = Math.max(0, Math.min(1, (e - 0.48) / 0.52))
        const surge = surgeU * surgeU * (3 - 2 * surgeU)
        const postU = Math.max(0, Math.min(1, (t - INTRO_PHASES.fractureEnd) / (1 - INTRO_PHASES.fractureEnd)))
        const post = postU * postU * (3 - 2 * postU)
        const radialDrive = shock + 1.35 * surge + 1.15 * post
        const lift = d.apex * (shock + 0.95 * surge + 0.85 * post)
        return new Vector3(f.center.x + d.vx * radialDrive, f.center.y + d.vy * radialDrive, 0.00002 + lift)
      }

      const sheetWorldMatrix = (p: number) => {
        const state = sampleOpening(p)
        const release = state.poseT <= 0.5 ? smooth01((state.poseT - 0.7) / 0.3)
          : state.poseT >= 1 ? 1 : Math.pow((state.poseT - 0.5) / 0.5, 1.4)
        return SHEET_ROTATION.clone().multiply(new Matrix4().makeTranslation(-cx * release, -cy * release, -0.18 * release))
      }

      // 1. Check 12 evenly spaced positions around the 360° bullet-time orbit (p = 0.43..0.452)
      let minCamShardDist = Infinity
      let pastAtStart = 0
      let approachingAtStart = 0
      for (let step = 0; step <= 12; step++) {
        const p = SHATTER_ORBIT_START + (SHATTER_ORBIT_END - SHATTER_ORBIT_START) * (step / 12)
        const t = breakthroughSubjectTimeAt(p)
        sampleOpeningCamera(layout, 1440 / 900, p, cam)
        const frame = sheetWorldMatrix(p)
        const camDistToTarget = cam.position.distanceTo(cam.target)
        const viewDir = cam.target.clone().sub(cam.position).normalize()
        let inFrontOfCamera = 0
        let betweenCameraAndTarget = 0
        let beyondCameraRadius = 0
        for (let i = 0; i < baked.fragments.length; i++) {
          const worldPos = shardPos(i, t).applyMatrix4(frame)
          const rFromTarget = worldPos.distanceTo(cam.target)
          const dToCam = worldPos.distanceTo(cam.position)
          if (dToCam < minCamShardDist) minCamShardDist = dToCam
          const toShard = worldPos.clone().sub(cam.position)
          const alongView = toShard.dot(viewDir)
          if (alongView > 0.02) {
            const cosAngle = alongView / Math.max(dToCam, 1e-6)
            if (cosAngle > 0.75) inFrontOfCamera++
            if (alongView < camDistToTarget) betweenCameraAndTarget++
          }
          if (rFromTarget > camDistToTarget) beyondCameraRadius++
        }
        if (step === 0) {
          pastAtStart = beyondCameraRadius
          approachingAtStart = baked.fragments.length - beyondCameraRadius
        }
        // Every orbital position looks through a dense field of debris
        expect(inFrontOfCamera).toBeGreaterThanOrEqual(15)
        expect(betweenCameraAndTarget).toBeGreaterThanOrEqual(12)
      }

      // Some shards have already flown past the camera at orbit start, and some are still approaching
      expect(pastAtStart).toBeGreaterThanOrEqual(18)
      expect(approachingAtStart).toBeGreaterThanOrEqual(40)
      // Definite close calls (near misses) along the 360° camera path
      expect(minCamShardDist).toBeLessThan(0.11)

      // 2. When bullet-time ends (0.452 -> 0.46), remaining shards speed up and race past the camera,
      // and never fall back onto or near the drawing (sheet z stays high and positive).
      const tEnd = breakthroughSubjectTimeAt(0.46)
      sampleOpeningCamera(layout, 1440 / 900, 0.46, cam)
      const endFrame = sheetWorldMatrix(0.46)
      const endCamRadius = cam.position.distanceTo(cam.target)
      let racedPastCamera = 0
      for (let i = 0; i < baked.fragments.length; i++) {
        const localEnd = shardPos(i, tEnd)
        const localOrbitEnd = shardPos(i, breakthroughSubjectTimeAt(SHATTER_ORBIT_END))
        // Monotonically blasts away from the sheet — never falls back onto or near the drawing
        expect(localEnd.z).toBeGreaterThan(0.2)
        expect(localEnd.z).toBeGreaterThan(localOrbitEnd.z)
        expect(Math.hypot(localEnd.x - baked.fragments[i].center.x, localEnd.y - baked.fragments[i].center.y))
          .toBeGreaterThan(Math.hypot(localOrbitEnd.x - baked.fragments[i].center.x, localOrbitEnd.y - baked.fragments[i].center.y))
        const worldEnd = localEnd.clone().applyMatrix4(endFrame)
        if (worldEnd.distanceTo(cam.target) > endCamRadius) racedPastCamera++
      }
      expect(racedPastCamera).toBeGreaterThan(baked.fragments.length * 0.65)
    } finally {
      baked.dispose()
    }
  }, 60000)
})
