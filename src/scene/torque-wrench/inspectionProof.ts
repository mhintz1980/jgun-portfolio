/** On-demand measurements of the installed study, never a second narrative clock. */
import { Box3, Matrix3, Mesh, PerspectiveCamera, Quaternion, Raycaster, Triangle, Vector3, type Scene, type WebGLRenderer } from 'three'
import type { StoryRuntime } from '../inspection/story'

export function measureInstalledInspection(runtime: StoryRuntime, camera: PerspectiveCamera) {
  runtime.root.updateWorldMatrix(true, true)
  camera.updateMatrixWorld()
  const cutter = runtime.root.getObjectByName('shaper-cutter')
  if (!cutter) throw new Error('Installed shaper cutter missing')
  const inverseStudy = runtime.root.matrixWorld.clone().invert(), studyPoint = new Vector3()
  const point = new Vector3(), closest = new Vector3(), triangle = new Triangle()
  let vertices = 0, triangles = 0, cameraClearance = Infinity
  const rect = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity, minDepth: Infinity, maxDepth: -Infinity }
  const discRect = { ...rect }
  const contactRect = { ...rect }
  let contactVertices = 0
  cutter.traverseVisible(object => {
    if (!(object instanceof Mesh)) return
    const position = object.geometry.getAttribute('position'), index = object.geometry.index
    if (!position) return
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld)
      // Entire near-shaft sector of the real disc, including both rake faces and
      // tooth flank vertices. Study radial plane is XY; shaft axis is -Z.
      studyPoint.copy(point).applyMatrix4(inverseStudy)
      const contact = object.name === 'shaper-cutter-disc' && Math.hypot(studyPoint.x, studyPoint.y) <= 0.009
      point.project(camera)
      rect.left = Math.min(rect.left, (point.x + 1) / 2)
      rect.right = Math.max(rect.right, (point.x + 1) / 2)
      rect.top = Math.min(rect.top, (1 - point.y) / 2)
      rect.bottom = Math.max(rect.bottom, (1 - point.y) / 2)
      rect.minDepth = Math.min(rect.minDepth, point.z); rect.maxDepth = Math.max(rect.maxDepth, point.z)
      if (object.name === 'shaper-cutter-disc') {
        discRect.left = Math.min(discRect.left, (point.x + 1) / 2); discRect.right = Math.max(discRect.right, (point.x + 1) / 2)
        discRect.top = Math.min(discRect.top, (1 - point.y) / 2); discRect.bottom = Math.max(discRect.bottom, (1 - point.y) / 2)
        discRect.minDepth = Math.min(discRect.minDepth, point.z); discRect.maxDepth = Math.max(discRect.maxDepth, point.z)
      }
      if (contact) {
        contactRect.left = Math.min(contactRect.left, (point.x + 1) / 2); contactRect.right = Math.max(contactRect.right, (point.x + 1) / 2)
        contactRect.top = Math.min(contactRect.top, (1 - point.y) / 2); contactRect.bottom = Math.max(contactRect.bottom, (1 - point.y) / 2)
        contactRect.minDepth = Math.min(contactRect.minDepth, point.z); contactRect.maxDepth = Math.max(contactRect.maxDepth, point.z)
        contactVertices++
      }
      vertices++
    }
    for (let i = 0, n = index?.count ?? position.count; i + 2 < n; i += 3) {
      triangle.a.fromBufferAttribute(position, index ? index.getX(i) : i).applyMatrix4(object.matrixWorld)
      triangle.b.fromBufferAttribute(position, index ? index.getX(i + 1) : i + 1).applyMatrix4(object.matrixWorld)
      triangle.c.fromBufferAttribute(position, index ? index.getX(i + 2) : i + 2).applyMatrix4(object.matrixWorld)
      triangle.closestPointToPoint(camera.position, closest)
      cameraClearance = Math.min(cameraClearance, closest.distanceTo(camera.position)); triangles++
    }
  })
  const disc = cutter.getObjectByName('shaper-cutter-disc')
  const discBox = disc ? new Box3().setFromObject(disc, true) : null
  let studyClearanceLowerBound = Infinity
  let visibleMeshes = 0
  const bounds = new Box3()
  runtime.root.traverseVisible(object => {
    if (!(object instanceof Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    if (materials.every(material => !material.visible || material.opacity < 0.01)) return
    bounds.setFromObject(object, true)
    studyClearanceLowerBound = Math.min(studyClearanceLowerBound, bounds.distanceToPoint(camera.position))
    visibleMeshes++
  })
  const telemetry: Record<string, unknown> = {}
  runtime.telemetry(telemetry)
  const subjectTransforms: Array<{ name: string; position: number[]; quaternion: number[] }> = []
  // Diagnostic only: project every installed, visible CAD vertex, including
  // the unit's actual slide and carrier/planet rotation. No proxy bounding box.
  const cascadeRects: Array<{ index: number; name: string; opacity: number; vertices: number; ndc: number[] }> = []
  runtime.root.traverse(unit => {
    const index = unit.userData.stage1CascadeIndex
    if (typeof index !== 'number' || !unit.visible) return
    const row = { index, name: unit.name, opacity: 0, vertices: 0, ndc: [Infinity, Infinity, -Infinity, -Infinity] }
    unit.traverseVisible(object => {
      if (!(object instanceof Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      const alpha = Math.max(...materials.map(material => material.visible ? material.opacity : 0))
      if (alpha < 0.01) return
      row.opacity = Math.max(row.opacity, alpha)
      const positions = object.geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).project(camera)
        row.ndc[0] = Math.min(row.ndc[0], point.x); row.ndc[1] = Math.min(row.ndc[1], point.y)
        row.ndc[2] = Math.max(row.ndc[2], point.x); row.ndc[3] = Math.max(row.ndc[3], point.y)
        row.vertices++
      }
    })
    if (row.vertices > 0) cascadeRects.push(row)
  })
  const stage1Contact = measureStage1Contact(runtime, camera)
  const quaternion = new Quaternion()
  for (const name of ['study-legacyshaft', 'study-approvedshaft']) {
    runtime.root.getObjectByName(name)?.traverseVisible(object => {
      if (!(object instanceof Mesh) || object.name === 'study-section-backface') return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      if (materials.every(material => material.opacity < 0.01 || !material.visible)) return
      object.getWorldPosition(point); object.getWorldQuaternion(quaternion)
      subjectTransforms.push({ name: name + '/' + object.name, position: point.toArray(), quaternion: quaternion.toArray() })
    })
  }
  return { visible: runtime.root.visible && cutter.visible, vertices, triangles, rect, discRect,
    contactRect, contactVertices, contactMethod: 'All real disc vertices within 9 mm of the shaft axis in study XY; both faces and near-shaft tooth flanks', subjectTransforms,
    studyClearanceLowerBound, visibleMeshes, cascadeRects, stage1Contact,
    cameraClearance, near: camera.near, discBounds: discBox ? [discBox.min.toArray(), discBox.max.toArray()] : null,
    telemetry }
}

/** Real finished-sun flank vertices and first-hit ray occlusion, on demand only.
 * Transparent witnesses do not obstruct the contact; opaque carriers and the
 * shaft body do. This is sampled visibility, not a triangle collision solver.
 */
export function measureStage1Contact(runtime: StoryRuntime, camera: PerspectiveCamera) {
  const result = { vertices: 0, ndc: [Infinity, Infinity, -Infinity, -Infinity], diameterUnitHeight: 0,
    raySamples: 0, visibleSamples: 0, occludedSamples: 0, visibleFraction: 0, occluders: {} as Record<string, number> }
  const subject = runtime.root.getObjectByName('study-approvedshaft')
  if (!subject?.visible) return result
  runtime.root.updateWorldMatrix(true, true); camera.updateMatrixWorld()
  const inverse = runtime.root.matrixWorld.clone().invert(), local = new Vector3(), world = new Vector3()
  const projected = new Vector3(), normal = new Vector3(), direction = new Vector3()
  const axis = new Vector3(0, 0, 1).transformDirection(runtime.root.matrixWorld)
  const normals = new Matrix3(), ray = new Raycaster(), opaque: Mesh[] = []
  runtime.root.traverseVisible(object => {
    if (!(object instanceof Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    if (materials.some(material => material.visible && material.opacity >= 0.95)) opaque.push(object)
  })
  const candidates: Vector3[] = []
  subject.traverseVisible(object => {
    if (!(object instanceof Mesh) || object.name === 'study-stress-surface' || object.name === 'study-section-backface') return
    const positions = object.geometry.getAttribute('position'), attributes = object.geometry.getAttribute('normal')
    if (!positions || !attributes) return
    normals.getNormalMatrix(object.matrixWorld)
    for (let i = 0; i < positions.count; i++) {
      world.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld)
      local.copy(world).applyMatrix4(inverse)
      const y = -local.z * 1000, r = Math.hypot(local.x, local.y) * 1000
      if (y < 3.15 || y > 9.55 || r < 4.45 || r > 5.95) continue
      normal.fromBufferAttribute(attributes, i).applyMatrix3(normals).normalize()
      if (Math.abs(normal.dot(axis)) > 0.85) continue
      direction.subVectors(camera.position, world).normalize()
      if (normal.dot(direction) < 0.15) continue
      // Shaft-local axial end caps and radial crests are not the driving flanks.
      local.set(local.x, local.y, 0).normalize().transformDirection(runtime.root.matrixWorld)
      if (Math.abs(normal.dot(local)) > 0.97) continue
      projected.copy(world).project(camera)
      result.ndc[0] = Math.min(result.ndc[0], projected.x); result.ndc[1] = Math.min(result.ndc[1], projected.y)
      result.ndc[2] = Math.max(result.ndc[2], projected.x); result.ndc[3] = Math.max(result.ndc[3], projected.y)
      result.vertices++; candidates.push(world.clone())
    }
  })
  const stride = Math.max(1, Math.floor(candidates.length / 64))
  for (let i = 0; i < candidates.length && result.raySamples < 64; i += stride) {
    const target = candidates[i], distance = camera.position.distanceTo(target)
    direction.subVectors(target, camera.position).normalize(); ray.set(camera.position, direction)
    ray.near = camera.near; ray.far = distance + 0.00015
    const hit = ray.intersectObjects(opaque, false)[0]
    result.raySamples++
    if (hit && Math.abs(hit.distance - distance) <= 0.00015) result.visibleSamples++
    else {
      result.occludedSamples++
      const name = hit?.object.name ?? 'no surface hit'
      result.occluders[name] = (result.occluders[name] ?? 0) + 1
    }
  }
  result.visibleFraction = result.visibleSamples / Math.max(1, result.raySamples)
  // Unit-height pixels; the browser verifier resolves against its actual viewport.
  result.diameterUnitHeight = Math.max((result.ndc[2] - result.ndc[0]) * camera.aspect,
    result.ndc[3] - result.ndc[1]) / 2
  return result
}

/** Beauty A/B measures real shader/depth occlusion. Restore visibility even on capture failure. */
export function captureInstalledCutter(runtime: StoryRuntime, gl: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {
  const cutter = runtime.root.getObjectByName('shaper-cutter')
  if (!cutter || !runtime.root.visible || !cutter.visible) throw new Error('Cutter is not installed and visible')
  const visible = cutter.visible
  const currentTarget = gl.getRenderTarget()
  if (currentTarget) throw new Error('Cutter proof requires the presentation framebuffer')
  let withCutter = '', withoutCutter = ''
  try {
    gl.render(scene, camera); withCutter = gl.domElement.toDataURL('image/png')
    cutter.visible = false
    gl.render(scene, camera); withoutCutter = gl.domElement.toDataURL('image/png')
  } finally {
    cutter.visible = visible
    gl.render(scene, camera)
  }
  return { withCutter, withoutCutter }
}
