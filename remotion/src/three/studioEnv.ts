import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, Scene } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const smooth01 = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

/** The torque-wrench page's procedural studio (src/scene/SceneCanvas.tsx): HDR softboxes with
 *  vertex roll-off and black flags, so the clearcoat reads exactly as it does on the site. */
function createStudio() {
  const studio = new Scene()
  studio.background = new Color(0.025, 0.03, 0.04)
  const softbox = (w: number, h: number, p: [number, number, number], tint: string, gain: number) => {
    const g = new PlaneGeometry(w, h, 32, 32)
    const pos = g.getAttribute('position')
    const colors = new Float32Array(pos.count * 3)
    const c = new Color(tint).multiplyScalar(gain)
    for (let i = 0; i < pos.count; i++) {
      const e = smooth01((1 - Math.abs(pos.getX(i) / (w / 2))) / 0.45) * smooth01((1 - Math.abs(pos.getY(i) / (h / 2))) / 0.45)
      colors[i * 3] = c.r * e
      colors[i * 3 + 1] = c.g * e
      colors[i * 3 + 2] = c.b * e
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3))
    const m = new Mesh(g, new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, toneMapped: false }))
    m.position.set(...p)
    m.lookAt(0, 0, 0)
    studio.add(m)
  }
  softbox(6, 9, [-6, 5, 6], '#f4f6ff', 6)
  softbox(4, 7, [7, 2, 3], '#d7e8ff', 3)
  softbox(7, 5, [0, 8, -1], '#ffffff', 4.5)
  softbox(2, 8, [2, 2, -7], '#e6efff', 8)
  softbox(14, 10, [0, -6.5, 7.5], '#f5f7f9', 1.2)
  // A warm Revision-Orange kicker so the thread colour lives in the reflections too.
  softbox(1.2, 7, [-7, 1, -3], '#ff7a3d', 2.2)
  for (const p of [[-5, 0, -4], [5, -2, 0]] as const) {
    const flag = new Mesh(new PlaneGeometry(4, 10), new MeshBasicMaterial({ color: 0x000000, side: DoubleSide, toneMapped: false }))
    flag.position.set(p[0], p[1], p[2])
    flag.lookAt(0, 0, 0)
    studio.add(flag)
  }
  return studio
}

export function StudioEnvironment({ kind = 'studio', intensity = 1 }: { kind?: 'studio' | 'room'; intensity?: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const source = kind === 'studio' ? createStudio() : new RoomEnvironment()
    const target = pmrem.fromScene(source, 0.04, 0.1, 100, kind === 'studio' ? { size: 256 } : undefined)
    scene.environment = target.texture
    scene.environmentIntensity = intensity
    pmrem.dispose()
    return () => {
      scene.environment = null
      target.dispose()
    }
  }, [gl, scene, kind, intensity])
  return null
}
