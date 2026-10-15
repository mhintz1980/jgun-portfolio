import { describe, expect, it } from 'vitest'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { createCameraHandoff, type CameraHandoffPose } from './CameraHandoff'

const pose = (p: number[], t: number[], up: number[], fov: number): CameraHandoffPose => ({
  position: new Vector3(...p), target: new Vector3(...t), up: new Vector3(...up), fov,
})
const from = pose([.32, .16, .74], [0, 0, -.15], [0, 1, 0], 42)
const to = pose([-.23855, 0, -.03534], [0, 0, -.009], [0, 0, -1], 17)
const fresh = () => pose([0, 0, 0], [0, 0, 0], [0, 1, 0], 0)
const rotation = (p: CameraHandoffPose) => new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(p.position, p.target, p.up))

describe('private camera domain handoff', () => {
  it('matches both camera poses and look orientation at endpoints', () => {
    const sample = createCameraHandoff()
    for (const [u, expected] of [[0, from], [1, to]] as const) {
      const result = sample(from, to, u, 0, 1, fresh())
      expect(result.position.distanceTo(expected.position)).toBeLessThan(1e-12)
      expect(result.target.distanceTo(expected.target)).toBeLessThan(1e-12)
      expect(rotation(result).angleTo(rotation(expected))).toBeLessThan(1e-7)
      expect(result.fov).toBe(expected.fov)
    }
  })
  it('has vanishing endpoint position, target, orientation and FOV rates', () => {
    const sample = createCameraHandoff(), h = 1e-5
    for (const endpoint of [0, 1]) {
      const a = sample(from, to, endpoint, 0, 1, fresh())
      const b = sample(from, to, endpoint === 0 ? h : 1-h, 0, 1, fresh())
      expect(a.position.distanceTo(b.position)/h).toBeLessThan(1e-6)
      expect(a.target.distanceTo(b.target)/h).toBeLessThan(1e-6)
      expect(Math.abs(a.fov-b.fov)/h).toBeLessThan(1e-6)
      expect(rotation(a).angleTo(rotation(b))).toBeLessThan(1e-7)
    }
  })
  it('retraces on reverse and remains independent of sample history', () => {
    const sample = createCameraHandoff(), expected = sample(from,to,.4,0,1,fresh())
    for (const u of [.9, .1, .7, .4]) sample(from,to,u,0,1,fresh())
    const reverse = sample(from,to,.4,0,1,fresh())
    expect(reverse.position.toArray()).toEqual(expected.position.toArray())
    expect(reverse.target.toArray()).toEqual(expected.target.toArray())
    expect(reverse.up.toArray()).toEqual(expected.up.toArray())
    expect(reverse.fov).toEqual(expected.fov)
  })
  it('keeps the view and up vectors nondegenerate through a large roll change', () => {
    const sample = createCameraHandoff()
    for (let i=0;i<=100;i++) {
      const result=sample(from,to,i/100,0,1,fresh())
      const look = result.target.clone().sub(result.position).normalize()
      expect(result.position.toArray().every(Number.isFinite)).toBe(true)
      expect(Math.abs(look.dot(result.up))).toBeLessThan(1e-12)
      expect(result.up.length()).toBeCloseTo(1,12)
    }
  })
})
