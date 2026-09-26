import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Box3, Matrix4, MeshBasicMaterial, Vector3, type Camera, type Mesh, type Object3D } from 'three'
import { Text } from 'troika-three-text'
import { getQuality } from '../../state/qualityStore'
import { getScrollState } from '../../state/scrollStore'
import type { WrenchRig } from '../rig/nodeRoles'
import { SHEET_FONTS } from '../drawing/sheet/sheetText'
import { STATIONS, type StationAnchor } from './stationData'
import { pushStationFrame, stationFrame } from './stationStore'

/**
 * JG-035 station driver. Mounted after <CameraRig/> at the same frame priority, so it reads
 * the camera AFTER this frame's update — anchors never trail the model by a frame.
 *
 * Owns two things:
 *  1. the screen projection of each station's anchor (written into the shared StationFrame
 *     for the DOM overlay), riding the live rig units so anchors follow the explode;
 *  2. the huge faint in-canvas process line, camera-locked BEHIND the model so the model
 *     occludes it — the one piece of station typography that has to live in the 3D scene.
 */

const CREAM = 0xefe6d0
const BACKGROUND_OPACITY = 0.028
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smooth01 = (x: number) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}

interface LocalBounds {
  box: Box3
  radius: number
}

const boundsCache = new WeakMap<Object3D, LocalBounds>()
const inverse = new Matrix4()
const relative = new Matrix4()
const meshBox = new Box3()

/** Unit bounds in the unit's own frame (child transforms are static relative to the unit). */
function localBounds(unit: Object3D): LocalBounds {
  const cached = boundsCache.get(unit)
  if (cached) return cached
  unit.updateWorldMatrix(true, true)
  inverse.copy(unit.matrixWorld).invert()
  const box = new Box3()
  unit.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    relative.multiplyMatrices(inverse, mesh.matrixWorld)
    box.union(meshBox.copy(mesh.geometry.boundingBox!).applyMatrix4(relative))
  })
  const size = box.getSize(new Vector3())
  const result = { box, radius: Math.max(size.x, size.y) / 2 }
  boundsCache.set(unit, result)
  return result
}

const centre = new Vector3()
const axisDir = new Vector3()
const toCamera = new Vector3()
const scratch = new Vector3()

function anchorWorld(anchor: StationAnchor, rig: WrenchRig, inner: Object3D | undefined, camera: Vector3, out: Vector3): boolean {
  if (anchor.model) {
    if (!inner) return false
    out.set(anchor.model[0], anchor.model[1], anchor.model[2]).applyMatrix4(inner.matrixWorld)
    return true
  }
  const unit = anchor.unit?.(rig)
  if (!unit) return false
  const { box, radius } = localBounds(unit)
  centre.set(
    (box.min.x + box.max.x) / 2,
    (box.min.y + box.max.y) / 2,
    box.min.z + (box.max.z - box.min.z) * (anchor.axial ?? 0.5),
  )
  centre.applyMatrix4(unit.matrixWorld)
  const e = unit.matrixWorld.elements
  axisDir.set(e[8], e[9], e[10])
  const scale = axisDir.length() || 1
  axisDir.multiplyScalar(1 / scale)
  // Push from the unit's axis toward the camera, perpendicular to the axis, so the anchor
  // lands on the visible side of a turned part whatever the camera is doing.
  toCamera.subVectors(camera, centre)
  toCamera.addScaledVector(axisDir, -toCamera.dot(axisDir))
  if (toCamera.lengthSq() < 1e-12) toCamera.set(0, 1, 0)
  toCamera.normalize()
  out.copy(centre).addScaledVector(toCamera, radius * scale * (anchor.radial ?? 0))
  return true
}

const projected = new Vector3()
const modelBox = new Box3()
const corner = new Vector3()
const cornerPx = [0, 0]

/** World point -> CSS px, written into `out` at `offset`. False when behind the camera. */
function toScreen(v: Vector3, camera: Camera, size: { width: number; height: number }, out: number[], offset: number): boolean {
  projected.copy(v).project(camera)
  out[offset] = ((projected.x + 1) / 2) * size.width
  out[offset + 1] = ((1 - projected.y) / 2) * size.height
  return projected.z < 1 && projected.z > -1
}

export function StationDriver() {
  const { camera, scene, size } = useThree()

  const background = useMemo(() => {
    const text = new Text()
    text.font = SHEET_FONTS.semibold
    text.fontSize = 1
    text.anchorX = 'center'
    text.anchorY = 'middle'
    text.letterSpacing = -0.01
    text.material = new MeshBasicMaterial({
      color: CREAM,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    })
    text.fillOpacity = 0
    text.frustumCulled = false
    text.renderOrder = -2
    text.visible = false
    text.name = 'station-background-type'
    return text
  }, [])

  useEffect(() => {
    scene.add(background)
    return () => {
      scene.remove(background)
      background.dispose()
    }
  }, [scene, background])

  const world = useMemo(() => new Vector3(), [])
  const forward = useMemo(() => new Vector3(), [])
  const state = useMemo(() => ({ text: '' }), [])

  useFrame(() => {
    const f = stationFrame
    const rig = (window as unknown as { __rig?: WrenchRig }).__rig
    const mode = (window as unknown as Record<string, string | undefined>).__drawingProofMode
    const { reducedMotion, tier } = getQuality()
    const p = getScrollState().progress
    let index = -1
    if (rig && !reducedMotion && tier !== 'poster' && (mode === undefined || mode === 'normal')) {
      for (let i = 0; i < STATIONS.length; i += 1) {
        if (p >= STATIONS[i].window[0] && p < STATIONS[i].window[1]) index = i
      }
    }
    f.index = index
    f.width = size.width
    f.height = size.height
    if (index < 0 || !rig) {
      background.visible = false
      pushStationFrame()
      return
    }
    const station = STATIONS[index]
    const u = (p - station.window[0]) / (station.window[1] - station.window[0])
    f.u = u

    const outer = scene.getObjectByName('jgun-live-registered-model')
    const inner = outer?.children[0]
    inner?.updateWorldMatrix(true, false)
    // Screen bounds of the model (geometry bounding boxes only — no vertex walk).
    f.model[0] = Infinity
    f.model[1] = Infinity
    f.model[2] = -Infinity
    f.model[3] = -Infinity
    if (outer) {
      modelBox.setFromObject(outer)
      for (let i = 0; i < 8; i += 1) {
        corner.set(i & 1 ? modelBox.max.x : modelBox.min.x, i & 2 ? modelBox.max.y : modelBox.min.y, i & 4 ? modelBox.max.z : modelBox.min.z)
        toScreen(corner, camera, size, cornerPx, 0)
        f.model[0] = Math.min(f.model[0], cornerPx[0])
        f.model[1] = Math.min(f.model[1], cornerPx[1])
        f.model[2] = Math.max(f.model[2], cornerPx[0])
        f.model[3] = Math.max(f.model[3], cornerPx[1])
      }
    }
    f.anchor[2] = 0
    if (!station.card && anchorWorld(station.anchor, rig, inner, camera.position, world)) {
      f.anchor[2] = toScreen(world, camera, size, f.anchor, 0) ? 1 : 0
    }
    f.secondary[2] = 0
    if (station.secondary && anchorWorld(station.secondary, rig, inner, camera.position, world)) {
      f.secondary[2] = toScreen(world, camera, size, f.secondary, 0) ? 1 : 0
    }
    f.axis[4] = 0
    if (station.centreline && inner) {
      // The whole stack, snout face to the rear of the clutch train, in the GLTF frame.
      world.set(0, 0, 0.056).applyMatrix4(inner.matrixWorld)
      const a = toScreen(world, camera, size, f.axis, 0)
      world.set(0, 0, -0.16).applyMatrix4(inner.matrixWorld)
      const b = toScreen(world, camera, size, f.axis, 2)
      f.axis[4] = a && b ? 1 : 0
    }

    // Background process line: camera-locked, behind the model, bleeding off both edges.
    if (state.text !== station.background) {
      state.text = station.background
      background.text = station.background
      background.sync()
    }
    const bounds = background.textRenderInfo?.blockBounds
    const perspective = camera as { fov?: number; aspect?: number }
    if (bounds && perspective.fov) {
      if (outer) outer.getWorldPosition(scratch)
      const distance = camera.position.distanceTo(scratch) + 0.32
      camera.getWorldDirection(forward)
      const viewWidth = 2 * distance * Math.tan((perspective.fov * Math.PI) / 360) * (perspective.aspect ?? 1)
      const scale = (viewWidth * 1.12) / Math.max(1e-6, bounds[2] - bounds[0])
      background.position.copy(camera.position).addScaledVector(forward, distance)
      background.quaternion.copy(camera.quaternion)
      // Slow lateral drift across the window: the line slides under the model like a pan.
      background.translateX(viewWidth * (0.04 - 0.08 * u))
      background.translateY(-viewWidth * 0.06)
      background.scale.setScalar(scale)
      const fade = smooth01(u / 0.22) * (1 - smooth01((u - 0.8) / 0.18))
      background.fillOpacity = BACKGROUND_OPACITY * fade
      background.visible = fade > 0.001
    } else background.visible = false

    pushStationFrame()
  })

  return null
}
