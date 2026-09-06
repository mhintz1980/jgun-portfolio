import {
  Box3,
  CanvasTexture,
  LinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
  Vector3,
  type Object3D,
} from 'three'
import { roleMaterial } from './materials'

/**
 * JG-025 — rear LCD cluster dressing (owner reference render 2026-09-02).
 *
 * The GLB carries the cluster geometry (screen P002115, buttons
 * P002123/24/25, endcap housing P001924) with zero UVs and fused
 * single-material button meshes, so the reference's look is built code-side:
 * a glossy red bezel ring around the screen, a white-on-dark data readout
 * (dual-unit torque 1,250 N·m / 922 FT-LB, owner ruling 2026-09-06) on
 * a decal plane over the screen face, and luminous laser-etched white
 * ▲/⏎/▼ symbols on the button caps (owner ruling 2026-09-06). Placements are measured AT BUILD TIME (rest pose) off the
 * union bounds of each part's mesh descendants — multi-primitive parts and
 * appended consolidation meshes make any single child an unstable basis —
 * then parented to the part nodes so the whole cluster rides the handle
 * explosion rigidly.
 *
 * Zero per-frame work: canvases draw once here, all geometry is static.
 */

export interface LcdClusterParts {
  bezel: Mesh
  readout: Mesh
  symbols: Mesh[]
  buttonMeshes: Mesh[]
}

const READOUT_W = 512
const READOUT_H = 256
const SYMBOL_SIZE = 128

/** Centered rounded-rectangle outline path (bezel ring helper). */
function roundedRectPath(target: Shape, w: number, h: number, r: number): void {
  const x = -w / 2
  const y = -h / 2
  target.moveTo(x + r, y)
  target.lineTo(x + w - r, y)
  target.quadraticCurveTo(x + w, y, x + w, y + r)
  target.lineTo(x + w, y + h - r)
  target.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  target.lineTo(x + r, y + h)
  target.quadraticCurveTo(x, y + h, x, y + h - r)
  target.lineTo(x, y + r)
  target.quadraticCurveTo(x, y, x + r, y)
}

/**
 * The LCD readout — dark field, white digits (plan A: "white readout on dark
 * field"). Dual-unit industrial content per the owner ruling 2026-09-06:
 * primary torque readout 1,250 N·m, PEAK (left) / CAL OK (right) status row,
 * and a full battery (4/4 bars) + STAGE 5 mode + 922 FT-LB secondary unit.
 */
function createLcdReadoutTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = READOUT_W
  canvas.height = READOUT_H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#0a0e12'
  ctx.fillRect(0, 0, READOUT_W, READOUT_H)

  // Faint status strip along the top edge.
  ctx.fillStyle = '#141b22'
  ctx.fillRect(0, 0, READOUT_W, 6)

  const ink = '#eef6ff'
  const dimInk = '#8fb6c9'

  // Top status row.
  ctx.font = 'bold 26px Consolas, "Courier New", monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = dimInk
  ctx.fillText('PEAK', 22, 44)
  ctx.textAlign = 'right'
  ctx.fillText('CAL OK', READOUT_W - 22, 44)

  // Main torque readout.
  ctx.textAlign = 'right'
  ctx.fillStyle = ink
  ctx.font = 'bold 118px Consolas, "Courier New", monospace'
  ctx.fillText('1,250', 396, 176)
  ctx.font = 'bold 46px Consolas, "Courier New", monospace'
  ctx.fillStyle = dimInk
  ctx.fillText('N·m', READOUT_W - 24, 176)

  // Bottom row: battery bar + mode glyph + secondary units.
  ctx.strokeStyle = ink
  ctx.lineWidth = 4
  ctx.strokeRect(24, 204, 72, 30)
  ctx.fillStyle = ink
  ctx.fillRect(96, 212, 6, 14) // battery nub
  // 4 of 4 bars bright — full charge (owner ruling 2026-09-06).
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(30 + i * 17, 210, 13, 18)
  }
  ctx.font = 'bold 30px Consolas, "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = ink
  ctx.fillText('STAGE 5', 250, 230)
  ctx.textAlign = 'right'
  ctx.fillStyle = dimInk
  ctx.font = 'bold 26px Consolas, "Courier New", monospace'
  ctx.fillText('922 FT-LB', READOUT_W - 24, 230)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

/**
 * Luminous laser-etched button symbol — ▲ / ⏎ / ▼. Crisp pure-white glyph
 * with a soft translucent-white outline for clean antialiased edges, over a
 * faint radial aura of LED light diffusing through the translucent etched
 * silicone membrane ("crisp white Option A with a soft touch of B", owner
 * ruling 2026-09-06).
 */
function createButtonSymbolTexture(kind: 'up' | 'enter' | 'down'): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = SYMBOL_SIZE
  canvas.height = SYMBOL_SIZE
  const ctx = canvas.getContext('2d')!

  // Aura first so the glyph sits on top: soft radial LED glow behind the
  // glyph center, fading to faintly warm full transparency at the edge.
  const aura = ctx.createRadialGradient(64, 64, 0, 64, 64, 58)
  aura.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
  aura.addColorStop(1, 'rgba(255, 200, 200, 0)')
  ctx.fillStyle = aura
  ctx.fillRect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE)

  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 4
  ctx.lineJoin = 'round'

  const path = new Path2D()
  if (kind === 'up') {
    path.moveTo(64, 24)
    path.lineTo(104, 92)
    path.lineTo(24, 92)
    path.closePath()
  } else if (kind === 'down') {
    path.moveTo(64, 104)
    path.lineTo(104, 36)
    path.lineTo(24, 36)
    path.closePath()
  } else {
    // Enter/return: arrow pointing left with a down-hooked tail.
    path.moveTo(96, 30)
    path.lineTo(96, 66)
    path.lineTo(52, 66)
    path.lineTo(52, 82)
    path.lineTo(22, 56)
    path.lineTo(52, 30)
    path.lineTo(52, 44)
    path.lineTo(80, 44)
    path.lineTo(80, 30)
    path.closePath()
  }
  ctx.fill(path)
  ctx.stroke(path)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

/**
 * One measured cluster part. GLTFLoader expands multi-primitive parts into
 * one mesh child per primitive (screen P002115: 22; buttons P002123/24/25:
 * 112-118) and consolidation appends a merged mesh as a further child, so
 * any single child is an unstable measurement basis — primitive 0 of the
 * screen is a zero-thickness edge sliver. `bounds` carries the real
 * measurement: the union AABB of ALL mesh descendants in the part node's
 * local frame (child-order independent; identical pre/post consolidation).
 * `mesh` is the first direct mesh child, kept only as the identity
 * reference exported in `buttonMeshes`.
 */
interface PartMesh {
  node: Object3D
  mesh: Mesh
  bounds: Box3
}

function findPartMesh(root: Object3D, nameRe: RegExp): PartMesh | null {
  let found: PartMesh | null = null
  root.traverse((node) => {
    if (found || !nameRe.test(node.name)) return
    let mesh: Mesh | null = null
    for (const child of node.children) {
      if ((child as Mesh).isMesh) {
        mesh = child as Mesh
        break
      }
    }
    if (!mesh) return
    // Union AABB over every mesh descendant, expressed in the part node's
    // local frame. updateWorldMatrix(true, true) is required here, before
    // the caller's root-wide refresh: consolidation adds merged meshes with
    // stale identity world matrices, and each mesh's node-relative
    // transform must resolve as inverse(node world) x mesh world.
    node.updateWorldMatrix(true, true)
    const nodeInverse = node.matrixWorld.clone().invert()
    const meshToNode = new Matrix4()
    const bounds = new Box3()
    node.traverse((descendant) => {
      const descendantMesh = descendant as Mesh
      if (!descendantMesh.isMesh) return
      descendantMesh.geometry.computeBoundingBox()
      meshToNode.multiplyMatrices(nodeInverse, descendantMesh.matrixWorld)
      bounds.union(new Box3().copy(descendantMesh.geometry.boundingBox!).applyMatrix4(meshToNode))
    })
    found = { node, mesh, bounds }
  })
  return found
}

/** World-space center of a part node's union bounds (rest pose). */
function worldMeshCenter(part: PartMesh): Vector3 {
  return part.node.localToWorld(part.bounds.getCenter(new Vector3()))
}

/** World-space unit direction of a node-local axis (0=x, 1=y, 2=z). */
function worldAxis(node: Object3D, axis: number): Vector3 {
  const e = node.matrixWorld.elements
  const col = axis === 0 ? [e[0], e[1], e[2]] : axis === 1 ? [e[4], e[5], e[6]] : [e[8], e[9], e[10]]
  return new Vector3(col[0], col[1], col[2]).normalize()
}

/**
 * Right-handed decal basis facing `normal` with +Y as close to `preferUp` as
 * the plane allows (falls back to world +Z when they are parallel). Keeps
 * canvas text unmirrored: x = y × z satisfies x × y = z by construction.
 */
function decalBasis(normal: Vector3, preferUp: Vector3): Quaternion {
  const z = normal.clone().normalize()
  let up = preferUp.clone().addScaledVector(z, -preferUp.dot(z))
  if (up.lengthSq() < 0.01) {
    const fallback = new Vector3(0, 0, 1)
    up = fallback.addScaledVector(z, -fallback.dot(z))
  }
  up.normalize()
  const x = up.clone().cross(z).normalize()
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, up, z))
}

/** Parent a mesh to `parent` realizing a world-space placement. */
function attachInWorld(parent: Object3D, mesh: Mesh, worldPos: Vector3, worldQuat: Quaternion): void {
  const world = new Matrix4().compose(worldPos, worldQuat, new Vector3(1, 1, 1))
  const local = world.premultiply(parent.matrixWorld.clone().invert())
  local.decompose(mesh.position, mesh.quaternion, mesh.scale)
  parent.add(mesh)
}

/**
 * Build the cluster dressing. Returns null when the cluster parts are absent
 * (rig changed) so the caller can degrade gracefully.
 */
export function buildLcdCluster(root: Object3D, finalMeshes: Mesh[]): LcdClusterParts | null {
  const screen = findPartMesh(root, /^P002115-\d+/)
  const buttonParts = [
    findPartMesh(root, /^P002123-\d+/),
    findPartMesh(root, /^P002124-\d+/),
    findPartMesh(root, /^P002125-\d+/),
  ]
  if (!screen || buttonParts.some((b) => !b)) return null

  root.updateMatrixWorld(true)

  // Outward reference: the cluster faces away from the handle mass.
  let handleRoot: Object3D | null = null
  root.traverse((node) => {
    if (!handleRoot && /HANDLE[\s_]*ASSY/i.test(node.name)) handleRoot = node
  })
  const handleCenter = handleRoot
    ? new Box3().setFromObject(handleRoot).getCenter(new Vector3())
    : new Box3().setFromObject(root).getCenter(new Vector3())

  const WORLD_UP = new Vector3(0, 1, 0)

  // ---- Screen: bezel ring + data readout on the panel face. Extents come
  // from the union bounds in the screen node's local frame: the smallest
  // extent is the panel normal axis, the two larger extents size the
  // bezel/readout to the real panel.
  const sSize = screen.bounds.getSize(new Vector3())
  const axes = [
    { axis: 0, size: sSize.x },
    { axis: 1, size: sSize.y },
    { axis: 2, size: sSize.z },
  ].sort((a, b) => b.size - a.size)
  const longHalf = axes[0].size / 2
  const shortHalf = axes[1].size / 2
  const thinHalf = axes[2].size / 2

  const screenCenter = worldMeshCenter(screen)
  const screenNormalRaw = worldAxis(screen.node, axes[2].axis)
  const outward =
    screenNormalRaw.dot(screenCenter.clone().sub(handleCenter)) >= 0 ? 1 : -1
  const screenNormal = screenNormalRaw.multiplyScalar(outward)
  const screenFace = screenCenter.clone().addScaledVector(screenNormal, thinHalf)

  // Bezel ring: red enamel frame hugging the screen perimeter.
  const frame = 0.0021
  const outer = new Shape()
  roundedRectPath(outer, 2 * (longHalf + frame), 2 * (shortHalf + frame), 0.0022)
  const holePath = new Shape()
  roundedRectPath(holePath, 2 * (longHalf - 0.0004), 2 * (shortHalf - 0.0004), 0.0012)
  outer.holes.push(holePath)
  const bezel = new Mesh(
    new ShapeGeometry(outer, 6),
    roleMaterial('lcdBezelRed'),
  )
  bezel.name = 'JG-025 LCD Bezel Ring (red, sampled #ad0707)'
  bezel.frustumCulled = true
  attachInWorld(
    screen.node,
    bezel,
    screenFace.clone().addScaledVector(screenNormal, 0.0002),
    decalBasis(screenNormal, WORLD_UP),
  )

  // Data readout: white-on-dark canvas LCD over the panel face.
  const readout = new Mesh(
    new PlaneGeometry(2 * longHalf - 0.003, 2 * shortHalf - 0.003),
    new MeshBasicMaterial({ map: createLcdReadoutTexture(), toneMapped: false }),
  )
  readout.name = 'JG-025 LCD Readout Decal (torque Nm + battery + mode)'
  readout.frustumCulled = true
  attachInWorld(
    screen.node,
    readout,
    screenFace.clone().addScaledVector(screenNormal, 0.0006),
    decalBasis(screenNormal, WORLD_UP),
  )

  // ---- Buttons: luminous white ▲/⏎/▼ symbol decals on each cap.
  const symbols: Mesh[] = []
  const buttonMeshes: Mesh[] = []
  const WORLD_UP_CLONE = WORLD_UP.clone()
  const ordered = buttonParts
    .map((part) => part!)
    .sort((a, b) => worldMeshCenter(b).y - worldMeshCenter(a).y)
  const kinds: Array<'up' | 'enter' | 'down'> = ['up', 'enter', 'down']

  for (let i = 0; i < ordered.length; i += 1) {
    const part = ordered[i]
    buttonMeshes.push(part.mesh)
    // Cap axis = the button-local axis most aligned with the screen normal:
    // the buttons sit coplanar with the screen on the rear face, so their
    // cap normal tracks the screen's, not their own longest extent. Axes
    // with a degenerate union extent (< 1e-6 m) are skipped; a part reduced
    // to a point has no placeable cap.
    const size = part.bounds.getSize(new Vector3())
    const extents = [size.x, size.y, size.z]
    let capAxis = -1
    let capAlign = -1
    for (let axis = 0; axis < 3; axis += 1) {
      if (extents[axis] < 1e-6) continue
      const align = Math.abs(worldAxis(part.node, axis).dot(screenNormal))
      if (align > capAlign) {
        capAlign = align
        capAxis = axis
      }
    }
    if (capAxis < 0) continue
    const capHalf = extents[capAxis] / 2

    const center = worldMeshCenter(part)
    const capNormalRaw = worldAxis(part.node, capAxis)
    const capOutward = capNormalRaw.dot(center.clone().sub(handleCenter)) >= 0 ? 1 : -1
    const capNormal = capNormalRaw.multiplyScalar(capOutward)
    const capFace = center.clone().addScaledVector(capNormal, capHalf)

    const symbol = new Mesh(
      new PlaneGeometry(0.0085, 0.0085),
      new MeshBasicMaterial({
        map: createButtonSymbolTexture(kinds[i] ?? 'enter'),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    )
    symbol.name = `JG-025 Button Symbol Decal (${kinds[i]})`
    symbol.frustumCulled = true
    attachInWorld(part.node, symbol, capFace.addScaledVector(capNormal, 0.0004), decalBasis(capNormal, WORLD_UP_CLONE))
    symbols.push(symbol)
  }

  finalMeshes.push(bezel, readout, ...symbols)
  return { bezel, readout, symbols, buttonMeshes }
}
