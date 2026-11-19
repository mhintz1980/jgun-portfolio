import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  Box3,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three'
import type { Material, Mesh, Object3D } from 'three'
import { DETENT, clampTilt, fitDistance, nearestDetent, stepSpin } from './benchMath'

// The WebGL half of the homepage model bench. Loaded lazily by ModelBench, so three.js and the
// model only download when a bench scrolls into view.

export type BenchVariant = 'gear-core' | 'enclosure'
export type BenchMode = 'shaded' | 'edges'

export interface BenchPalette {
  body: string
  paint: string
  dark: string
  edge: string
  paper: string
}

export interface BenchInfo {
  meshes: number
  triangles: number
}

interface BenchCanvasProps {
  url: string
  variant: BenchVariant
  mode: BenchMode
  palette: BenchPalette
  running: boolean
  reducedMotion: boolean
  /** Bumped by the step buttons: seq changes on every press, dir is -1 or 1. */
  nudge: { seq: number; dir: number }
  onReady: (info: BenchInfo) => void
}

type Role = 'body' | 'paint' | 'dark'

const FOV = 26
const START: Record<BenchVariant, { yaw: number; tilt: number }> = {
  'gear-core': { yaw: -DETENT * 3, tilt: 0.32 },
  enclosure: { yaw: DETENT * 3, tilt: 0.3 },
}

function materialName(mesh: Mesh): string {
  const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as Material | undefined
  return material?.name ?? ''
}

function hasAncestor(object: Object3D, test: (name: string) => boolean): boolean {
  for (let node: Object3D | null = object; node; node = node.parent) if (test(node.name)) return true
  return false
}

/** Which meshes of each model belong on the bench, and how each is painted. */
function classify(mesh: Mesh, variant: BenchVariant): Role | null {
  const name = materialName(mesh)
  if (variant === 'gear-core') {
    // The file carries a superseded and a current set of the same four parts; show the current one.
    return hasAncestor(mesh, (n) => n.startsWith('approved')) ? 'body' : null
  }
  // Helper volumes and a proposed, unbuilt duct are not part of the machine as shipped.
  if (/AIRWAY/i.test(name) || hasAncestor(mesh, (n) => /^PROPOSED/i.test(n))) return null
  if (/PAINT/i.test(name)) return 'paint'
  if (/RUBBER|PLASTIC|BLACK/i.test(name)) return 'dark'
  return 'body'
}

interface Built {
  root: Group
  meshes: { mesh: Mesh; role: Role }[]
  center: Vector3
  radius: number
  triangles: number
}

function build(scene: Object3D, variant: BenchVariant): Built {
  const root = new Group()
  root.add(scene.clone(true))
  root.updateMatrixWorld(true)
  const meshes: Built['meshes'] = []
  const box = new Box3()
  const part = new Box3()
  let triangles = 0
  root.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    const role = classify(mesh, variant)
    if (!role) {
      mesh.visible = false
      return
    }
    meshes.push({ mesh, role })
    mesh.geometry.computeBoundingBox()
    if (mesh.geometry.boundingBox) box.union(part.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld))
    const index = mesh.geometry.index
    triangles += (index ? index.count : mesh.geometry.attributes.position.count) / 3
  })
  const center = box.isEmpty() ? new Vector3() : box.getCenter(new Vector3())
  const radius = box.isEmpty() ? 1 : box.getSize(new Vector3()).length() / 2
  return { root, meshes, center, radius, triangles: Math.round(triangles) }
}

/** Every hard edge of the visible parts as one line object, in the model root's space. */
function buildEdges(built: Built, material: LineBasicMaterial): LineSegments {
  const chunks: Float32Array[] = []
  let total = 0
  const point = new Vector3()
  // The root is already mounted (and turning) by now, so take each mesh relative to the root.
  built.root.updateWorldMatrix(true, true)
  const toRoot = built.root.matrixWorld.clone().invert()
  const local = new Matrix4()
  for (const { mesh } of built.meshes) {
    const edges = new EdgesGeometry(mesh.geometry, 32)
    const source = edges.attributes.position
    const out = new Float32Array(source.count * 3)
    local.multiplyMatrices(toRoot, mesh.matrixWorld)
    for (let i = 0; i < source.count; i++) {
      point.fromBufferAttribute(source, i).applyMatrix4(local)
      out[i * 3] = point.x
      out[i * 3 + 1] = point.y
      out[i * 3 + 2] = point.z
    }
    edges.dispose()
    chunks.push(out)
    total += out.length
  }
  const merged = new Float32Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(merged, 3))
  const lines = new LineSegments(geometry, material)
  lines.name = 'bench-edges'
  return lines
}

function Rig({ url, variant, mode, palette, reducedMotion, nudge, onReady }: Omit<BenchCanvasProps, 'running'>) {
  const { scene } = useGLTF(url, '/draco/')
  const { camera, size, gl } = useThree()
  const tiltGroup = useRef<Group>(null)
  const turnGroup = useRef<Group>(null)
  const spin = useRef({ angle: START[variant].yaw, tilt: START[variant].tilt, velocity: 0, dragging: false, auto: !reducedMotion })
  const edgesRef = useRef<LineSegments | null>(null)

  const built = useMemo(() => build(scene, variant), [scene, variant])
  const materials = useMemo(
    () => ({
      body: new MeshStandardMaterial({ metalness: 0.55, roughness: 0.42 }),
      paint: new MeshStandardMaterial({ metalness: 0.1, roughness: 0.55 }),
      dark: new MeshStandardMaterial({ metalness: 0.2, roughness: 0.7 }),
      // Edges mode: faces painted the paper colour hide the lines behind them.
      paper: new MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
      line: new LineBasicMaterial(),
    }),
    [],
  )

  useEffect(() => {
    materials.body.color = new Color(palette.body)
    materials.paint.color = new Color(palette.paint)
    materials.dark.color = new Color(palette.dark)
    materials.paper.color = new Color(palette.paper)
    materials.line.color = new Color(palette.edge)
  }, [materials, palette])

  useEffect(() => {
    if (mode === 'edges' && !edgesRef.current) {
      edgesRef.current = buildEdges(built, materials.line)
      built.root.add(edgesRef.current)
    }
    if (edgesRef.current) edgesRef.current.visible = mode === 'edges'
    for (const { mesh, role } of built.meshes) mesh.material = mode === 'edges' ? materials.paper : materials[role]
  }, [built, materials, mode])

  useEffect(() => {
    onReady({ meshes: built.meshes.length, triangles: built.triangles })
    return () => {
      edgesRef.current?.geometry.dispose()
      edgesRef.current = null
    }
  }, [built, onReady])

  useEffect(() => () => { for (const material of Object.values(materials)) material.dispose() }, [materials])

  // Frame the model for the current panel shape.
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    const distance = fitDistance(built.radius, FOV, size.width / Math.max(1, size.height))
    camera.position.set(0, 0, distance)
    camera.near = Math.max(distance - built.radius * 1.5, built.radius / 50)
    camera.far = distance + built.radius * 1.5
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [built, camera, size.height, size.width])

  // Drag to turn. Vertical touch drags stay with the page (touch-action: pan-y on the canvas).
  useEffect(() => {
    const element = gl.domElement
    let pointer: number | null = null
    let lastX = 0
    let lastY = 0
    let lastTime = 0
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      pointer = event.pointerId
      lastX = event.clientX
      lastY = event.clientY
      lastTime = performance.now()
      spin.current.dragging = true
      spin.current.auto = false
      spin.current.velocity = 0
      element.setPointerCapture(event.pointerId)
      element.dataset.dragging = ''
    }
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return
      const now = performance.now()
      const scale = (Math.PI * 1.2) / Math.max(240, element.clientWidth)
      const dx = (event.clientX - lastX) * scale
      spin.current.angle += dx
      if (event.pointerType !== 'touch') spin.current.tilt = clampTilt(spin.current.tilt + (event.clientY - lastY) * scale * 0.6)
      const dt = Math.max(1, now - lastTime) / 1000
      spin.current.velocity = spin.current.velocity * 0.5 + (dx / dt) * 0.5
      lastX = event.clientX
      lastY = event.clientY
      lastTime = now
    }
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return
      pointer = null
      spin.current.dragging = false
      if (performance.now() - lastTime > 120) spin.current.velocity = 0
      spin.current.velocity = Math.max(-9, Math.min(9, spin.current.velocity))
      delete element.dataset.dragging
    }
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
    }
  }, [gl])

  // Step buttons: one notch per press.
  const seenNudge = useRef(nudge.seq)
  useEffect(() => {
    if (nudge.seq === seenNudge.current) return
    seenNudge.current = nudge.seq
    const state = spin.current
    state.auto = false
    if (reducedMotion) {
      state.angle = nearestDetent(state.angle) + nudge.dir * DETENT
      state.velocity = 0
    } else {
      // Enough of a push to clear this notch and be caught by the next one.
      state.velocity = nudge.dir * 1.7
    }
  }, [nudge, reducedMotion])

  useEffect(() => { if (reducedMotion) spin.current.auto = false }, [reducedMotion])

  useFrame((_, delta) => {
    const state = spin.current
    if (state.auto) state.angle += Math.min(delta, 0.05) * 0.22
    else if (!state.dragging) {
      const next = stepSpin(state, delta)
      state.angle = next.angle
      state.velocity = next.velocity
    }
    if (turnGroup.current) turnGroup.current.rotation.y = state.angle
    if (tiltGroup.current) tiltGroup.current.rotation.x = state.tilt
    gl.domElement.dataset.angle = state.angle.toFixed(4)
  })

  return (
    <>
      <hemisphereLight args={['#ffffff', '#3a4250', 1.15]} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.9} />
      <group ref={tiltGroup}>
        <group ref={turnGroup}>
          <primitive object={built.root} position={[-built.center.x, -built.center.y, -built.center.z]} />
        </group>
      </group>
    </>
  )
}

export default function ModelBenchCanvas({ running, ...rig }: BenchCanvasProps) {
  return (
    <Canvas
      className="bench-canvas"
      frameloop={running ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ fov: FOV, position: [0, 0, 5] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
    >
      <Rig {...rig} />
    </Canvas>
  )
}
