import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { AnimationMixer, Group, LoopOnce, type Mesh, Vector2, Vector3 } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  APPROACH_START, BLACK_FINISH_START, CONTACT_END, INSPECTION_DURATION, CONTACT_START, FINAL_ANGLE, FORMING_END, MAX_FEATURE_HZ, newFrame, odMask, RETURN_START, RING_FEATURES, RING_RADIUS, RING_WIDTH,
  rollerAngle, ROLLER_TEETH, sampleInspection, sampleSpin, SHOULDER, SPIN_RATE, TOOL_FADE_END, TOOL_FADE_MIN_CLEARANCE, TOOL_FADE_START,
  TRAVERSE_END, TRAVERSE_START, WHEEL_RADIUS, WHEEL_WIDTH,
} from './timeline'

describe('Ring Switch cinematic contact lifecycle', () => {
  it('retains a two-second traverse with progressive relief and a continuous ring angle', () => {
    expect(TRAVERSE_END - TRAVERSE_START).toBe(2)
    let lastAngle = -1, lastKnurl = -1
    for (let t = 0; t <= 10.5; t += 0.01) {
      const f = sampleInspection(t, newFrame())
      expect(f.angle).toBeGreaterThanOrEqual(lastAngle)
      expect(f.knurl).toBeGreaterThanOrEqual(lastKnurl)
      if (t > TRAVERSE_START && t < TRAVERSE_END) {
        expect(f.toolVisible).toBe(true)
        expect(f.clipTime).toBeCloseTo(55 / 30 + t - 4.2)
        expect(f.aluminium).toBe(1)
      }
      lastAngle = f.angle; lastKnurl = f.knurl
    }
    expect(sampleInspection(5.2, newFrame()).knurl).toBeGreaterThan(0)
    expect(sampleInspection(5.2, newFrame()).knurl).toBeLessThan(1)
  })
  it('finishes OD relief before jaw opening/withdrawal and retains it through black return', () => {
    const end = sampleInspection(6.2, newFrame()), clear = sampleInspection(8.2, newFrame()), back = sampleInspection(12, newFrame())
    expect(end.knurl).toBeLessThan(1); expect(end.clipTime).toBe(115 / 30)
    expect(FORMING_END).toBeLessThan(CONTACT_END)
    expect(sampleInspection(FORMING_END, newFrame()).knurl).toBe(1)
    expect(clear.toolVisible).toBe(false); expect(clear.knurl).toBe(1)
    expect(back.aluminium).toBe(0); expect(back.returnBlend).toBe(1); expect(back.knurl).toBe(1)
  })
  it('never applies knurl to the bore, end faces or edge lands, including at full progress', () => {
    const radius = .037722, half = .027204 / 2
    for (const p of [0, .2, .5, 1]) {
      expect(odMask(radius - .004, 0, 0, radius, half, p)).toBe(0)
      expect(odMask(radius, 0, 1, radius, half, p)).toBe(0)
      expect(odMask(radius, half - SHOULDER / 2, 0, radius, half, p)).toBe(0)
    }
    expect(odMask(radius, -half + SHOULDER + .001, 0, radius, half, .5)).toBe(1)
    expect(odMask(radius, half - SHOULDER - .001, 0, radius, half, .5)).toBe(0)
  })
  it('clamps invalid timeline extents to the entry/completed frames', () => {
    expect(sampleInspection(-100, newFrame()).time).toBe(0)
    expect(sampleInspection(100, newFrame()).time).toBe(12)
  })
})

describe('ring spin: physical forming rate, filtered detail and eight-turn finish', () => {
  const dt = 1e-3
  it('has a continuous angle, rate and monotone phase from 0 to 12 s', () => {
    const last = sampleSpin(0, newFrame()), now = newFrame()
    for (let t = dt; t <= 12; t += dt) {
      sampleSpin(t, now)
      expect(now.angle).toBeGreaterThanOrEqual(last.angle - 1e-12)
      expect(now.spin).toBeGreaterThanOrEqual(0)
      expect(Math.abs(now.angle - last.angle - (now.spin + last.spin) / 2 * dt)).toBeLessThan(2e-6)
      expect(Math.abs(now.spin - last.spin)).toBeLessThan(0.046) // includes the smooth post-contact slowdown
      last.angle = now.angle; last.spin = now.spin
    }
    expect(sampleInspection(5, now).spin).toBe(SPIN_RATE)
    for (const time of [1.2, 2.8, CONTACT_START, TRAVERSE_START, TRAVERSE_END, CONTACT_END, CONTACT_END + .4, 8.2, RETURN_START]) {
      sampleSpin(time - 1e-7, last); sampleSpin(time + 1e-7, now)
      expect(Math.abs(now.angle - last.angle)).toBeLessThan(3e-6)
      expect(Math.abs(now.spin - last.spin)).toBeLessThan(1e-5)
    }
  })
  it('requests bounded temporal filtering without slowing the true forming angles', () => {
    const frame = newFrame()
    const ratio = RING_RADIUS / WHEEL_RADIUS
    for (let t = 0; t <= 12; t += 0.005) {
      const f = sampleInspection(t, frame)
      expect(f.ringDetailScale).toBeGreaterThan(0); expect(f.ringDetailScale).toBeLessThanOrEqual(1)
      expect(f.rollerDetailScale).toBeGreaterThan(0); expect(f.rollerDetailScale).toBeLessThanOrEqual(1)
      const ringHz = f.spin / (2 * Math.PI) * 2 * RING_FEATURES
      const rollerHz = f.spin / (2 * Math.PI) * ratio * ROLLER_TEETH
      expect(ringHz * f.ringDetailScale).toBeLessThanOrEqual(MAX_FEATURE_HZ + 1e-9)
      expect(rollerHz * f.rollerDetailScale).toBeLessThanOrEqual(MAX_FEATURE_HZ + 1e-9)
      for (const fps of [30, 60]) {
        expect(ringHz * f.ringDetailScale / fps).toBeLessThanOrEqual(.25 + 1e-9)
        expect(rollerHz * f.rollerDetailScale / fps).toBeLessThanOrEqual(.25 + 1e-9)
      }
    }
    const formed = sampleInspection(5, frame)
    expect(formed.spin).toBeGreaterThan(10)
    expect(formed.ringDetailScale).toBeLessThan(.02)
    expect(formed.rollerDetailScale).toBeLessThan(.01)
    expect(sampleInspection(12, frame).ringDetailScale).toBe(1)
    expect(frame.rollerDetailScale).toBe(1)
    expect(sampleInspection(2, frame).knurl).toBe(0); expect(frame.toolVisible).toBe(false)
  })
  it('ends on whole turns so the pin holes register with the saved assembly', () => {
    const frame = newFrame()
    expect(FINAL_ANGLE / (2 * Math.PI)).toBe(8)
    expect(sampleSpin(10.5, frame).angle).toBeCloseTo(FINAL_ANGLE, 9)
    expect(sampleSpin(12, frame).angle).toBeCloseTo(FINAL_ANGLE, 9)
    expect(sampleSpin(10.5, frame).spin).toBe(0)
  })
  it('derives the roller angle with equal tangential speed and opposite sense', () => {
    const R = .037722, r = WHEEL_RADIUS, a = sampleSpin(5, newFrame()).angle
    expect(rollerAngle(a, R, r) * r).toBeCloseTo(-a * R, 12)
  })
  it('writes caller-owned outputs and is deterministic under reverse or shuffled seeking', () => {
    const frame = newFrame(), expected = newFrame(), keys = Object.keys(frame)
    for (const t of [12, 5.7, 0, 9.3, 6.45, 3.8, 4.2, 2, 6.2]) {
      expect(sampleSpin(t, frame)).toBe(frame)
      expect(sampleInspection(t, frame)).toBe(frame)
      expect(frame).toEqual(sampleInspection(t, expected))
      expect(Object.keys(frame)).toEqual(keys)
    }
  })
})

describe('GLB-measured paired contact, dwell, clearance and worked band', () => {
  const R = .07544365628189591 / 2
  let gltf: GLTF, frame: Group, mixer: AnimationMixer
  beforeAll(async () => {
    const data = readFileSync('public/models/knurling-tool.glb')
    gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
    frame = new Group(); frame.rotation.x = Math.PI / 2; frame.add(gltf.scene)
    mixer = new AnimationMixer(gltf.scene)
    const action = mixer.clipAction(gltf.animations[0]); action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play()
  })
  const names = ['KT_UPPER_KNURL_WHEEL_RH', 'KT_LOWER_KNURL_WHEEL_LH']
  const measure = (t: number) => {
    mixer.setTime(sampleInspection(t, newFrame()).clipTime); frame.updateMatrixWorld(true)
    const p = new Vector3()
    return names.map(n => { const w = gltf.scene.getObjectByName(n)!; p.setFromMatrixPosition(w.matrixWorld); return { clearance: Math.hypot(p.x, p.y) - R - WHEEL_RADIUS, x: p.x, y: p.y, z: p.z, wheel: w } })
  }
  it('holds the actual paired OD contact, without axial travel, for at least 0.3 s before the traverse', () => {
    let first = NaN
    for (let t = APPROACH_START; t <= TRAVERSE_START; t += 0.001) {
      if (measure(t).every(m => m.clearance <= 2e-6)) { first = t; break }
    }
    expect(TRAVERSE_START - first).toBeGreaterThanOrEqual(0.3)
    expect(TRAVERSE_START - first).toBeLessThan(0.5) // contact is not claimed before it exists
    const start = measure(first)
    for (let t = first; t <= TRAVERSE_START; t += 0.01) measure(t).forEach((m, i) => { expect(m.clearance).toBeLessThanOrEqual(2e-6); expect(m.clearance).toBeGreaterThan(-2e-6); expect(m.z).toBeCloseTo(start[i].z, 9) })
    expect(sampleInspection(CONTACT_START, newFrame()).contact).toBe(true)
    expect(sampleInspection(CONTACT_START - 0.05, newFrame()).contact).toBe(false)
    // Closing is monotone and visibly open until a few frames before contact.
    let last = Infinity
    for (let t = APPROACH_START; t <= first; t += 0.01) { const c = measure(t)[0].clearance; expect(c).toBeLessThanOrEqual(last + 1e-9); last = c }
    expect(measure(CONTACT_START - 0.1)[0].clearance).toBeGreaterThan(1e-4)
  })
  it('rolls both contacts without slip with rollers on opposite sides of the OD', () => {
    for (const t of [CONTACT_START + .1, 5, 6]) {
      const spin = sampleInspection(t, newFrame()).spin, rate = -spin * R / WHEEL_RADIUS
      measure(t).forEach(m => {
        const q = new Vector3(m.x, m.y, 0).setLength(R)
        const axis = new Vector3(0, 1, 0).transformDirection(m.wheel.matrixWorld)
        const omega = rate * axis.z
        const vRing = new Vector2(-q.y, q.x).multiplyScalar(spin)
        const vWheel = new Vector2(-(q.y - m.y), q.x - m.x).multiplyScalar(omega)
        expect(vWheel.distanceTo(vRing)).toBeLessThan(spin * 2e-9) // Float32 GLB contact-centre precision
      })
    }
    expect(Math.sign(measure(5)[0].y)).toBe(-Math.sign(measure(5)[1].y))
  })
  it('keeps the worked-band head at or behind the leading roller edge and off bore/lands', () => {
    const halfWidth = .027204217025541766 / 2
    for (let t = TRAVERSE_START; t <= TRAVERSE_END; t += 0.01) {
      const f = sampleInspection(t, newFrame()), root = (mixer.setTime(f.clipTime), gltf.scene.getObjectByName('KT_TOOL_ROOT')!.position.y)
      const centre = root * (halfWidth - SHOULDER - WHEEL_WIDTH / 2) / ((.027204217025541766 - WHEEL_WIDTH) / 2)
      const head = -(halfWidth - SHOULDER) + f.knurl * 2 * (halfWidth - SHOULDER)
      expect(head).toBeGreaterThanOrEqual(-halfWidth + SHOULDER)
      expect(head).toBeLessThanOrEqual(centre + WHEEL_WIDTH / 2 + 1e-9)
    }
  })
  it('completes a real circle at every axial slice before revealing its full-circumference relief', () => {
    const half = RING_WIDTH / 2, bandMin = -half + SHOULDER, bandMax = half - SHOULDER
    // Derive the active width from the immutable GLB rather than trusting the sampler's constant.
    const geometry = (gltf.scene.getObjectByName(names[0])!.children[0] as Mesh).geometry
    const positions = geometry.getAttribute('position')
    let minY = Infinity, maxY = -Infinity
    for (let i = 0; i < positions.count; i++) { minY = Math.min(minY, positions.getY(i)); maxY = Math.max(maxY, positions.getY(i)) }
    const width = maxY - minY
    expect(width).toBeCloseTo(WHEEL_WIDTH, 8)
    const slices = 257, angularBins = 360, step = .0005
    const coverage = Array.from({ length: slices }, () => new Uint8Array(angularBins))
    const sweptAngles = new Float64Array(slices), lastAngles = new Float64Array(slices).fill(NaN), revealed = new Uint8Array(slices)
    const frame = newFrame()
    const zAt = (i: number) => bandMin + (bandMax - bandMin) * (i + .5) / slices
    const scaledZ = (z: number) => z * (half - SHOULDER - width / 2) / ((RING_WIDTH - width) / 2)
    for (let t = CONTACT_START; t <= CONTACT_END; t += step) {
      sampleInspection(t, frame)
      const contacts = measure(t)
      for (let i = 0; i < slices; i++) {
        const z = zAt(i)
        const engaged = contacts.every(m => Math.abs(m.clearance) < 2e-6 && Math.abs(scaledZ(m.z) - z) <= width / 2)
        if (engaged) {
          if (!Number.isNaN(lastAngles[i])) sweptAngles[i] += frame.angle - lastAngles[i]
          lastAngles[i] = frame.angle
          for (const m of contacts) {
            const angle = ((Math.atan2(m.y, m.x) - frame.angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
            coverage[i][Math.floor(angle / (2 * Math.PI) * angularBins)] = 1
          }
        } else lastAngles[i] = NaN
        if (!revealed[i] && odMask(R, z, 0, R, half, frame.knurl)) {
          expect(sweptAngles[i], `slice ${i} revealed before a paired half-turn at ${t}`).toBeGreaterThanOrEqual(Math.PI)
          expect(coverage[i].reduce((n, hit) => n + hit, 0), `slice ${i} missing circumferential contact`).toBe(angularBins)
          revealed[i] = 1
        }
      }
    }
    expect(revealed.reduce((n, hit) => n + hit, 0)).toBe(slices)
    expect(sampleInspection(TRAVERSE_END, frame).knurl).toBeLessThan(1)
    expect(sampleInspection(FORMING_END, frame).knurl).toBe(1)
  })
  it('withdraws to measured positive clearance before the tool opacity falls', () => {
    const end = sampleInspection(TRAVERSE_END, newFrame())
    expect(end.toolOpacity).toBe(1)
    let clearedAt = NaN
    for (let t = TRAVERSE_END; t < TOOL_FADE_START; t += 0.001) if (measure(t).every(m => m.clearance > 1e-6)) { clearedAt = t; break }
    expect(clearedAt).toBeLessThan(TOOL_FADE_START)
    for (let t = 6; t <= 8.3; t += 0.005) {
      const f = sampleInspection(t, newFrame())
      if (f.toolOpacity < 1 && f.toolOpacity > 0) measure(t).forEach(m => expect(m.clearance).toBeGreaterThanOrEqual(TOOL_FADE_MIN_CLEARANCE))
    }
    expect(sampleInspection(TOOL_FADE_END, newFrame()).toolVisible).toBe(false)
    expect(sampleInspection(TOOL_FADE_END - 1e-3, newFrame()).toolVisible).toBe(true)
  })
  it('gives the finished black relief at least one second before the assembly return', () => {
    expect(sampleInspection(BLACK_FINISH_START, newFrame()).aluminium).toBe(0)
    expect(RETURN_START - BLACK_FINISH_START).toBeGreaterThanOrEqual(1)
    for (let t = BLACK_FINISH_START; t <= RETURN_START; t += 0.01) { const f = sampleInspection(t, newFrame()); expect(f.aluminium).toBe(0); expect(f.returnBlend).toBe(0); expect(f.knurl).toBe(1); expect(f.toolVisible).toBe(false) }
  })
  it('measures 128 roller teeth on the actual wheel meshes', () => {
    for (const name of names) {
      const geometry = (gltf.scene.getObjectByName(name)!.children[0] as Mesh).geometry, p = geometry.getAttribute('position')
      let tips = 0
      for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i) - 0.0015) < 0.00025 && Math.hypot(p.getX(i), p.getZ(i)) > 0.0113) tips++
      expect(tips).toBe(ROLLER_TEETH)
    }
  })
})

describe('drilled-hole concealment blend (JG-035 R1)', () => {
  // Independent oracle: absolute seconds straight from the owner request, not the module constants.
  const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t) }
  const oracle = (t: number) => smooth((t - 1.2) / 1.2) * (1 - smooth((t - 8.2) / 0.75))
  const blend = (t: number) => sampleInspection(t, newFrame()).holePlugBlend

  it('is open, closes 1.2-2.4 s with the aluminium conversion, and is fully concealed before the tool appears', () => {
    expect(blend(0)).toBe(0)
    expect(blend(1.2)).toBe(0)
    expect(blend(1.8)).toBeCloseTo(0.5, 12)
    expect(blend(2.4)).toBe(1)
    expect(APPROACH_START).toBe(2.8)
    for (let t = 2.4; t <= 8.2 + 1e-9; t += 0.01) expect(blend(t)).toBe(1)
  })

  it('stays concealed whenever any part of the tool prop is visible', () => {
    for (let t = 0; t <= 12; t += 0.005) {
      const f = sampleInspection(t, newFrame())
      if (f.toolVisible) expect(f.holePlugBlend).toBe(1)
    }
  })

  it('reopens 8.2-8.95 s: after forming (6.455 s) and tool disappearance (8.2 s), fully open 0.35 s before black completes', () => {
    expect(FORMING_END).toBeLessThan(8.2)
    expect(blend(8.2)).toBe(1)
    expect(blend(8.575)).toBeCloseTo(0.5, 12)
    expect(blend(8.95)).toBe(0)
    expect(BLACK_FINISH_START - 8.95).toBeCloseTo(0.35, 12)
    for (const t of [8.95, 9.0, 9.3, 10.5, 12]) expect(blend(t)).toBe(0)
    // Black completion keeps its landmark: darkening 8.2-9.3 s, unchanged.
    expect(sampleInspection(9.3, newFrame()).aluminium).toBe(0)
    expect(sampleInspection(8.2, newFrame()).aluminium).toBe(1)
  })

  it('matches the independent oracle everywhere, is monotone per ramp and reproducible under reverse and shuffled seeks', () => {
    const times = Array.from({ length: 2401 }, (_, i) => i * 0.005)
    const forward = times.map(blend)
    forward.forEach((v, i) => expect(v).toBeCloseTo(oracle(times[i]), 12))
    for (let i = 1; i < times.length; i += 1) {
      if (times[i] <= 2.4) expect(forward[i]).toBeGreaterThanOrEqual(forward[i - 1])
      if (times[i] >= 8.2) expect(forward[i]).toBeLessThanOrEqual(forward[i - 1])
    }
    const reversed = [...times].reverse().map(blend).reverse()
    expect(reversed).toStrictEqual(forward)
    const shuffled = times.map((_, i) => times[(i * 997) % times.length])
    shuffled.forEach(t => expect(blend(t)).toBe(forward[Math.round(t / 0.005)]))
  })

  it('preserves the 12 s duration and the contact / spin / finish landmarks', () => {
    expect(INSPECTION_DURATION).toBe(12)
    expect([TRAVERSE_START, TRAVERSE_END, TOOL_FADE_END, BLACK_FINISH_START, RETURN_START]).toEqual([4.2, 6.2, 8.2, 9.3, 10.5])
  })
})
