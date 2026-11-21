import { AdditiveBlending, BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Matrix4, Mesh,
  ShaderMaterial, Vector3, type Box3 } from 'three'
import type { ExtractionContext } from '../drawing/poseCore'

const clamp = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => { const u = clamp(x); return u * u * (3 - 2 * u) }
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
export const PORTAL_ARC_COUNT = 8
const SEGMENTS = 24, BRANCH_SEGMENTS = 10, VERTICES = (SEGMENTS + 1 + BRANCH_SEGMENTS + 1) * 2

/** Capture real CAD vertices once; avoid invented attachment points inside a bounding box. */
export function selectPortalContacts(geometry: BufferGeometry, bounds: Box3): Vector3[] {
  const a = geometry.getAttribute('position'), center = bounds.getCenter(new Vector3())
  const size = bounds.getSize(new Vector3()), point = new Vector3()
  return Array.from({ length: PORTAL_ARC_COUNT }, (_, i) => {
    const theta = i * Math.PI * 2 / PORTAL_ARC_COUNT
    const target = new Vector3(center.x + size.x * .5 * Math.cos(theta),
      center.y + size.y * .5 * Math.sin(theta), center.z + size.z * ((i % 4) / 3 - .5) * .72)
    let best = Infinity
    const result = new Vector3()
    for (let j = 0; j < a.count; j++) {
      point.fromBufferAttribute(a, j)
      const d = point.distanceToSquared(target)
      if (d < best) { best = d; result.copy(point) }
    }
    return result
  })
}

const vertex = `
attribute vec3 aTangent; attribute float aSide; attribute float aEnergy;
uniform float uWidth; varying float vAcross; varying float vEnergy;
void main(){
  vec3 p=(modelViewMatrix*vec4(position,1.0)).xyz;
  vec3 t=normalize(mat3(modelViewMatrix)*aTangent);
  vec3 side=cross(t,normalize(-p));
  if(dot(side,side)<.00001)side=vec3(1.,0.,0.);
  p+=normalize(side)*aSide*uWidth;
  vAcross=aSide;vEnergy=aEnergy;
  gl_Position=projectionMatrix*vec4(p,1.0);
}`
const fragment = `
uniform float uHalo; varying float vAcross; varying float vEnergy;
void main(){
  float x=abs(vAcross);
  float a=(1.-smoothstep(uHalo>.5?.0:.35,1.,x))*vEnergy;
  vec3 c=uHalo>.5?vec3(.015,.22,1.):mix(vec3(.05,.55,1.),vec3(.48,.91,1.),1.-x);
  gl_FragColor=vec4(c,a*(uHalo>.5?.26:.95));
}`

/** Eight two-branched camera-facing discharges, one shared buffer and two draw calls. */
export function createPortalLightning(outline: readonly number[][]) {
  const group = new Group(); group.name = 'portal-to-wrench-lightning'
  const geometry = new BufferGeometry()
  const positions = new Float32Array(PORTAL_ARC_COUNT * VERTICES * 3)
  const tangents = new Float32Array(positions.length), sides = new Float32Array(positions.length / 3)
  const energies = new Float32Array(sides.length), indices: number[] = []
  for (let i = 0; i < PORTAL_ARC_COUNT; i++) {
    let offset = i * VERTICES
    for (const segments of [SEGMENTS, BRANCH_SEGMENTS]) {
      for (let j = 0; j <= segments; j++) { sides[offset + j * 2] = -1; sides[offset + j * 2 + 1] = 1 }
      for (let j = 0; j < segments; j++) {
        const a = offset + j * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
      offset += (segments + 1) * 2
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aTangent', new Float32BufferAttribute(tangents, 3))
  geometry.setAttribute('aSide', new Float32BufferAttribute(sides, 1))
  geometry.setAttribute('aEnergy', new Float32BufferAttribute(energies, 1)); geometry.setIndex(indices)
  const materials = [false, true].map(halo => new ShaderMaterial({
    name: halo ? 'PortalArcBlueHalo' : 'PortalArcCyanCore', vertexShader: vertex, fragmentShader: fragment,
    uniforms: { uWidth: { value: halo ? .0038 : .00065 }, uHalo: { value: halo ? 1 : 0 } },
    blending: AdditiveBlending, side: DoubleSide, transparent: true, depthWrite: false, depthTest: true, toneMapped: false,
  }))
  materials.forEach((material, i) => {
    const mesh = new Mesh(geometry, material); mesh.name = i ? 'portal-arc-halos' : 'portal-arc-cores'
    mesh.frustumCulled = false; mesh.renderOrder = 6; group.add(mesh)
  })
  const relative = new Matrix4(), start = new Vector3(), end = new Vector3(), delta = new Vector3()
  const normal = new Vector3(), binormal = new Vector3(), point = new Vector3(), prior = new Vector3()
  const worldUp = new Vector3(0, 0, 1)
  const path = Array.from({ length: SEGMENTS + 1 }, () => new Vector3())
  const targets = Array.from({ length: PORTAL_ARC_COUNT }, () => new Vector3())
  const stats = { active: 0, branches: 0, energy: 0, endpointErrorM: 0, clock: 0 }
  const positionAttribute = geometry.getAttribute('position'), tangentAttribute = geometry.getAttribute('aTangent')
  const energyAttribute = geometry.getAttribute('aEnergy')
  return { group, stats, geometry,
    snapshot() {
      let fingerprint = 2166136261
      const words = new Uint32Array(positionAttribute.array.buffer, positionAttribute.array.byteOffset, positionAttribute.array.length)
      for (const word of words) fingerprint = Math.imul(fingerprint ^ word, 16777619)
      return { visible: group.visible, ...stats, fingerprint: fingerprint >>> 0,
        arcs: targets.map((target, i) => ({ target: target.toArray(),
          origin: new Vector3().fromBufferAttribute(positionAttribute, i * VERTICES).toArray(),
          endpoint: new Vector3().fromBufferAttribute(positionAttribute, i * VERTICES + SEGMENTS * 2).toArray() })) }
    },
    update(progress: number, contacts: readonly Vector3[], context: ExtractionContext, opacity: number) {
      const envelope = smooth((progress - .42) / .008) * (1 - smooth((progress - .453) / .012)) * opacity
      group.visible = envelope > .001 && contacts.length > 0 && outline.length > 0
      stats.active = 0; stats.branches = 0; stats.energy = 0; stats.endpointErrorM = 0; stats.clock = progress
      if (!group.visible) return
      relative.copy(context.sheetMatrix).invert().multiply(context.modelMatrix)
      const tick = Math.floor((progress - .42) * 3800)
      for (let i = 0; i < PORTAL_ARC_COUNT; i++) {
        const lip = outline[Math.floor((i + .31) / PORTAL_ARC_COUNT * outline.length) % outline.length]
        start.set(lip[0], lip[1], i % 3 === 0 ? -.075 : -.001)
        end.copy(contacts[i % contacts.length]).applyMatrix4(relative)
        targets[i].copy(end)
        const power = envelope * (.25 + .75 * Math.pow(hash(tick * 13 + i * 19), .6))
        stats.active++; stats.branches++; stats.energy += power
        delta.subVectors(end, start)
        normal.crossVectors(delta, worldUp)
        if (normal.lengthSq() < 1e-8) normal.set(1, 0, 0)
        normal.normalize(); binormal.crossVectors(delta, normal).normalize()
        for (let j = 0; j <= SEGMENTS; j++) {
          const u = j / SEGMENTS, amp = Math.sin(Math.PI * u) * (.009 + delta.length() * .055)
          path[j].copy(start).addScaledVector(delta, u)
            .addScaledVector(normal, (hash(tick * 41 + i * 71 + j * 3) - .5) * amp)
            .addScaledVector(binormal, (hash(tick * 29 + i * 31 + j * 7) - .5) * amp)
        }
        // Endpoints have no noise: attach exactly to the sampled CAD vertex and rim.
        path[0].copy(start); path[SEGMENTS].copy(end)
        let offset = i * VERTICES
        for (let branch = 0; branch < 2; branch++) {
          const count = branch ? BRANCH_SEGMENTS : SEGMENTS
          for (let j = 0; j <= count; j++) {
            if (!branch) point.copy(path[j])
            else {
              const u = j / count
              point.copy(path[9]).lerp(path[20], u).addScaledVector(normal, Math.sin(Math.PI * u) * .025)
                .addScaledVector(binormal, (hash(tick + j * 17 + i) - .5) * Math.sin(Math.PI * u) * .009)
            }
            if (j === 0) prior.copy(branch ? path[10] : path[1]).sub(point)
            else prior.copy(point).sub(path[branch ? Math.min(20, 9 + Math.floor(j * 11 / count)) : j - 1])
            if (prior.lengthSq() < 1e-10) prior.copy(delta)
            prior.normalize()
            for (let k = 0; k < 2; k++) {
              const v = offset + j * 2 + k
              positionAttribute.setXYZ(v, point.x, point.y, point.z)
              tangentAttribute.setXYZ(v, prior.x, prior.y, prior.z)
              energyAttribute.setX(v, power * (branch ? .42 : 1))
            }
          }
          offset += (count + 1) * 2
        }
        point.fromBufferAttribute(positionAttribute, i * VERTICES + SEGMENTS * 2)
        stats.endpointErrorM = Math.max(stats.endpointErrorM, point.distanceTo(end))
      }
      positionAttribute.needsUpdate = tangentAttribute.needsUpdate = energyAttribute.needsUpdate = true
    },
    dispose() { group.removeFromParent(); group.clear(); geometry.dispose(); materials.forEach(m => m.dispose()) },
  }
}
