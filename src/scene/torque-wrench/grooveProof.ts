/** On-demand depth-tested band proof. Never changes the narrative or live camera state. */
import { Box3, Mesh, PerspectiveCamera, Vector3, WebGLRenderTarget, type Scene, type WebGLRenderer } from 'three'

export interface GrooveCaptureOptions {
  camera?: { position: number[]; target: number[]; up?: number[]; fov?: number }
}

export function captureGrooveProof(
  gl: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, meshes: readonly Mesh[],
  options: GrooveCaptureOptions = {},
) {
  const names = { blue: 'P000420 Speed Indicator (Blue)', red: 'P000420 Speed Indicator (Red)' }
  const bands = Object.entries(names).map(([id, name]) => {
    const mesh = meshes.find(value => value.name === name)
    if (!mesh) throw new Error(`Groove mesh unavailable: ${name}`)
    return { id, mesh, visible: mesh.visible }
  })
  const override = options.camera
  if (override) {
    for (const vector of [override.position, override.target, override.up ?? [0, 1, 0]]) {
      if (vector.length !== 3 || !vector.every(Number.isFinite)) throw new RangeError('Invalid diagnostic camera vector')
    }
    if (override.fov !== undefined && (!Number.isFinite(override.fov) || override.fov <= 0 || override.fov >= 180)) {
      throw new RangeError('Invalid diagnostic camera field of view')
    }
  }
  const old = { position: camera.position.clone(), quaternion: camera.quaternion.clone(),
    up: camera.up.clone(), fov: camera.fov, projection: camera.projectionMatrix.clone(),
    inverseProjection: camera.projectionMatrixInverse.clone(), target: gl.getRenderTarget() }
  const width = gl.domElement.width, height = gl.domElement.height
  const renderTarget = new WebGLRenderTarget(width, height)
  const pixels = new Uint8Array(width * height * 4)
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) { renderTarget.dispose(); throw new Error('Diagnostic canvas unavailable') }
  const image = context.createImageData(width, height)
  const capture = () => {
    gl.setRenderTarget(renderTarget)
    gl.clear(); gl.render(scene, camera)
    gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels)
    for (let y = 0; y < height; y++) {
      image.data.set(pixels.subarray((height - y - 1) * width * 4, (height - y) * width * 4), y * width * 4)
    }
    context.putImageData(image, 0, 0)
    return canvas.toDataURL('image/png')
  }
  try {
    if (override) {
      camera.position.fromArray(override.position)
      camera.up.fromArray(override.up ?? [0, 1, 0])
      camera.lookAt(new Vector3().fromArray(override.target))
      if (override.fov !== undefined) camera.fov = override.fov
      camera.updateProjectionMatrix()
    }
    camera.updateMatrixWorld(true)
    scene.updateMatrixWorld(true)
    const point = new Vector3(), box = new Box3()
    const metadata = bands.map(({ id, mesh }) => {
      box.setFromObject(mesh)
      const center = box.getCenter(new Vector3()).toArray()
      const rect = [Infinity, Infinity, -Infinity, -Infinity]
      for (let i = 0; i < 8; i++) {
        point.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera)
        const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2
        rect[0] = Math.min(rect[0], x); rect[1] = Math.min(rect[1], y)
        rect[2] = Math.max(rect[2], x); rect[3] = Math.max(rect[3], y)
      }
      return { id, name: mesh.name, center, rect, matrix: mesh.matrixWorld.toArray(), visible: mesh.visible }
    })
    const beauty = capture()
    const without: Record<string, string> = {}
    for (const { id, mesh, visible } of bands) {
      mesh.visible = false
      try { without[id] = capture() } finally { mesh.visible = visible }
    }
    return { beauty, without, bands: metadata, drawingBuffer: [width, height],
      camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), up: camera.up.toArray(), fov: camera.fov } }
  } finally {
    for (const { mesh, visible } of bands) mesh.visible = visible
    camera.position.copy(old.position); camera.quaternion.copy(old.quaternion); camera.up.copy(old.up); camera.fov = old.fov
    camera.projectionMatrix.copy(old.projection); camera.projectionMatrixInverse.copy(old.inverseProjection)
    camera.updateMatrixWorld(true)
    gl.setRenderTarget(old.target)
    renderTarget.dispose()
  }
}
