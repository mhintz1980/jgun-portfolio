import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
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
import { cachedProfile, rememberProfile } from './drawingCache'

/**
 * The primary elevation's outer contour — the path the excitation pulse runs along and the
 * outline the model lifts out of. Traced from a silhouette render of the live geometry over
 * the primary view's rect only, at ~0.1 mm per pixel.
 */
export function bakeProfile(gl: WebGLRenderer, data: DrawingGeometry, layout: DrawingLayout): RenderedDrawing {
  const cached = cachedProfile(data, layout)
  if (cached) return profileFromPoints(cached)
  const view = layout.views.find((candidate) => candidate.name === 'side')
  if (!view) throw new Error('The drawing requires a side elevation')
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
  const clearColor = gl.getClearColor(new Color())
  const clearAlpha = gl.getClearAlpha()
  const pixels = new Uint8Array(w * h * 4)
  try {
    gl.setRenderTarget(target)
    // setRenderTarget installs physical pixels. setViewport would apply DPR a second time.
    gl.setClearColor(0x000000, 1)
    gl.clear()
    gl.render(scene, camera)
    gl.readRenderTargetPixels(target, 0, 0, w, h, pixels)
  } finally {
    gl.setRenderTarget(previous)
    gl.setClearColor(clearColor, clearAlpha)
    target.dispose()
    material.dispose()
  }

  const profilePoints = traceProfile(pixels, w, h).map(([px, py]) => [rx + (px / w) * rw, ry + (py / h) * rh])
  rememberProfile(data, layout, profilePoints)
  return profileFromPoints(profilePoints)
}

/** Input and output are sheet metres; mask pixels never escape bakeProfile. */
export function profileFromPoints(profilePoints: number[][]): RenderedDrawing {
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
