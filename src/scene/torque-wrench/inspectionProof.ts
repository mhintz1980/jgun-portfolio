/** On-demand measurements of the installed study, never a second narrative clock. */
import { Box3, Mesh, PerspectiveCamera, Quaternion, Triangle, Vector3, type Scene, type WebGLRenderer } from 'three'
import type { StoryRuntime } from '../inspection/story'

export function measureInstalledInspection(runtime: StoryRuntime, camera: PerspectiveCamera) {
  runtime.root.updateWorldMatrix(true, true)
  camera.updateMatrixWorld()
  const cutter = runtime.root.getObjectByName('shaper-cutter')
  if (!cutter) throw new Error('Installed shaper cutter missing')
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
      const contact = object.name === 'shaper-cutter-disc' && Math.hypot(point.x, point.y) <= 0.009
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
    studyClearanceLowerBound, visibleMeshes,
    cameraClearance, near: camera.near, discBounds: discBox ? [discBox.min.toArray(), discBox.max.toArray()] : null,
    telemetry }
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
