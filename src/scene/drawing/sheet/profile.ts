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
  type CleanupFailureSink,
  type DrawingGeometry,
  type DrawingLayout,
  type RenderedDrawing,
} from '../drawingGeometry'
import { cachedProfile, rememberProfile } from './drawingCache'

interface OwnedDisposable {
  dispose: () => void
}

function disposeAll(resources: readonly OwnedDisposable[], cleanupFailureSink?: CleanupFailureSink): void {
  const errors: unknown[] = []
  for (const resource of resources) {
    try {
      resource.dispose()
    } catch (error) {
      errors.push(error)
    }
  }
  if (!errors.length) return
  if (!cleanupFailureSink) throw errors[0]
  try {
    cleanupFailureSink(errors)
  } catch {
    // Cleanup reporting cannot make successful resource disposal throw.
  }
}

function rollbackOwned(resources: readonly OwnedDisposable[], cleanupFailureSink?: CleanupFailureSink): void {
  const errors: unknown[] = []
  for (const resource of resources) {
    try {
      resource.dispose()
    } catch (error) {
      errors.push(error)
    }
  }
  if (errors.length && cleanupFailureSink) {
    try {
      cleanupFailureSink(errors)
    } catch {
      // Preserve the factory's original error.
    }
  }
}

/**
 * The primary elevation's outer contour — the path the excitation pulse runs along and the
 * outline the model lifts out of. Traced from a silhouette render of the live geometry over
 * the primary view's rect only, at ~0.1 mm per pixel.
 */
export function bakeProfile(
  gl: WebGLRenderer,
  data: DrawingGeometry,
  layout: DrawingLayout,
  cleanupFailureSink?: CleanupFailureSink,
): RenderedDrawing {
  const cached = cachedProfile(data, layout)
  if (cached) return profileFromPoints(cached, cleanupFailureSink)
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
  let material: MeshBasicMaterial | null = null
  let target: WebGLRenderTarget | null = null
  let materialCleanupAttempted = false
  let targetCleanupAttempted = false
  const attemptOwnedCleanup = (errors: unknown[]) => {
    if (target && !targetCleanupAttempted) {
      targetCleanupAttempted = true
      try {
        target.dispose()
      } catch (error) {
        errors.push(error)
      }
    }
    if (material && !materialCleanupAttempted) {
      materialCleanupAttempted = true
      try {
        material.dispose()
      } catch (error) {
        errors.push(error)
      }
    }
  }
  let pixels!: Uint8Array
  try {
    const allocatedMaterial = new MeshBasicMaterial({ color: 0xffffff })
    material = allocatedMaterial
    const mesh = new Mesh(data.geometry, allocatedMaterial)
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(view.transform)
    mesh.matrixWorld.copy(view.transform)
    const scene = new Scene()
    scene.add(mesh)
    const renderTarget = new WebGLRenderTarget(w, h, { depthBuffer: true })
    target = renderTarget
    const previous = gl.getRenderTarget()
    const clearColor = gl.getClearColor(new Color())
    const clearAlpha = gl.getClearAlpha()
    pixels = new Uint8Array(w * h * 4)
    let hasPrimaryError = false
    try {
      gl.setRenderTarget(renderTarget)
      // setRenderTarget installs physical pixels. setViewport would apply DPR a second time.
      gl.setClearColor(0x000000, 1)
      gl.clear()
      gl.render(scene, camera)
      gl.readRenderTargetPixels(renderTarget, 0, 0, w, h, pixels)
    } catch (error) {
      hasPrimaryError = true
      throw error
    } finally {
      const cleanupErrors: unknown[] = []
      const attempt = (action: () => void) => {
        try {
          action()
        } catch (error) {
          cleanupErrors.push(error)
        }
      }
      attempt(() => gl.setRenderTarget(previous))
      attempt(() => gl.setClearColor(clearColor, clearAlpha))
      attempt(() => {
        if (target && !targetCleanupAttempted) {
          targetCleanupAttempted = true
          target.dispose()
        }
      })
      attempt(() => {
        if (material && !materialCleanupAttempted) {
          materialCleanupAttempted = true
          material.dispose()
        }
      })
      if (cleanupErrors.length) {
        if (cleanupFailureSink) {
          try {
            cleanupFailureSink(cleanupErrors)
          } catch {
            // Reporting failures cannot replace the renderer or render error.
          }
        } else if (!hasPrimaryError) throw cleanupErrors[0]
      }
    }
  } catch (error) {
    const rollbackErrors: unknown[] = []
    attemptOwnedCleanup(rollbackErrors)
    if (rollbackErrors.length && cleanupFailureSink) {
      try {
        cleanupFailureSink(rollbackErrors)
      } catch {
        // Preserve the profile's original error.
      }
    }
    throw error
  }

  const profilePoints = traceProfile(pixels, w, h).map(([px, py]) => [rx + (px / w) * rw, ry + (py / h) * rh])
  rememberProfile(data, layout, profilePoints)
  return profileFromPoints(profilePoints, cleanupFailureSink)
}

/** Input and output are sheet metres; mask pixels never escape bakeProfile. */
export function profileFromPoints(profilePoints: number[][], cleanupFailureSink?: CleanupFailureSink): RenderedDrawing {
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
  try {
    profile.setAttribute('position', new Float32BufferAttribute(positions, 3))
    profile.setAttribute('arcLength', new Float32BufferAttribute(arc, 1))
    const profileRibbon = buildProfileRibbon(profilePoints, arc, cleanupFailureSink)
    let disposed = false
    return {
      profile,
      profileRibbon,
      profilePoints,
      perimeter,
      dispose: (sink?: CleanupFailureSink) => {
        if (disposed) return
        disposed = true
        disposeAll([profile, profileRibbon], sink)
      },
    }
  } catch (error) {
    rollbackOwned([profile], cleanupFailureSink)
    throw error
  }
}
