import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  Vector4,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three'
import {
  buildProfileRibbon,
  traceProfile,
  type DrawingGeometry,
  type DrawingLayout,
  type RenderedDrawing,
} from '../drawingGeometry'

/**
 * The primary elevation's outer contour — the path the excitation pulse runs along and the
 * outline the model lifts out of. Traced from a silhouette render of the live geometry over
 * the primary view's rect only, at ~0.1 mm per pixel.
 */
export function bakeProfile(gl: WebGLRenderer, data: DrawingGeometry, layout: DrawingLayout): RenderedDrawing {
  const view = layout.views[0]
  const [rx, ry, rw, rh] = view.rect
  const ppm = 8000
  const w = Math.ceil(rw * ppm)
  const h = Math.ceil(rh * ppm)
  const camera = new OrthographicCamera(rx, rx + rw, ry + rh, ry, 0.01, 4)
  camera.position.set(0, 0, 2)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  const material = new MeshBasicMaterial({ color: 0xffffff })
  const mesh = new Mesh(data.geometry, material)
  mesh.matrixAutoUpdate = false
  mesh.matrix.copy(view.transform)
  mesh.matrixWorld.copy(view.transform)
  const scene = new Scene()
  scene.add(mesh)
  const target = new WebGLRenderTarget(w, h, { depthBuffer: true })
  const previous = gl.getRenderTarget()
  const viewport = gl.getViewport(new Vector4())
  const clearColor = gl.getClearColor(new Color())
  const clearAlpha = gl.getClearAlpha()
  gl.setRenderTarget(target)
  gl.setViewport(0, 0, w, h)
  gl.setClearColor(0x000000, 1)
  gl.clear()
  gl.render(scene, camera)
  const pixels = new Uint8Array(w * h * 4)
  gl.readRenderTargetPixels(target, 0, 0, w, h, pixels)
  gl.setRenderTarget(previous)
  gl.setViewport(viewport)
  gl.setClearColor(clearColor, clearAlpha)
  target.dispose()
  material.dispose()

  const profilePoints = traceProfile(pixels, w, h).map(([px, py]) => [rx + (px / w) * rw, ry + (py / h) * rh])
  const positions: number[] = []
  const lengths: number[] = []
  let perimeter = 0
  for (let i = 0; i < profilePoints.length; i += 1) {
    const p = profilePoints[i]
    if (i) perimeter += Math.hypot(p[0] - profilePoints[i - 1][0], p[1] - profilePoints[i - 1][1])
    positions.push(p[0], p[1], 0.0004)
    lengths.push(perimeter)
  }
  const arc = lengths.map((s) => s / Math.max(perimeter, 1e-9))
  const profile = new BufferGeometry()
  profile.setAttribute('position', new Float32BufferAttribute(positions, 3))
  profile.setAttribute('arcLength', new Float32BufferAttribute(arc, 1))
  const profileRibbon = buildProfileRibbon(profilePoints, arc)
  return {
    profile,
    profileRibbon,
    profilePoints,
    perimeter,
    dispose: () => {
      profile.dispose()
      profileRibbon.dispose()
    },
  }
}
