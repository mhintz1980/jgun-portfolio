import {
  Mesh, Vector2, Vector3, Vector4, WebGLRenderTarget, SRGBColorSpace,
  type Camera, type Material, type Object3D, type Scene, type WebGLRenderer,
} from 'three'
import type { WrenchRig } from '../rig/nodeRoles'

export const CASCADE_PROOF_FEATURES = [
  'inputSunTeeth', 'inputSixfold', 'stage1Planets', 'stage1Sun',
  'stage2Planets', 'stage2Sun', 'stage5Planets',
  'stage5Sun', 'stage3Planets', 'stage3Sun', 'stage4Planets', 'stage4Sun',
] as const
type Feature = typeof CASCADE_PROOF_FEATURES[number]

/** All selection is structural, never filtered by visibility, opacity or bounds. */
function selectFeatures(studyRoot: Object3D, rig?: WrenchRig) {
  const sets = Object.fromEntries(CASCADE_PROOF_FEATURES.map(id => [id, [] as Mesh[]])) as Record<Feature, Mesh[]>
  const roots: Object3D[] = []
  studyRoot.traverse(object => {
    if (/^study-approvedshaft$/.test(object.name) || typeof object.userData.stage1CascadeIndex === 'number') roots.push(object)
    if (/^MERGED stage[1-5] Planet \d+$/.test(object.name)) roots.push(object)
    if (!(object instanceof Mesh)) return
    let shaft = false, index: number | undefined, planet = false
    for (let node: Object3D | null = object; node && node !== studyRoot; node = node.parent) {
      shaft ||= /^study-approvedshaft$/.test(node.name)
      planet ||= /^MERGED stage[1-5] Planet \d+$/.test(node.name)
      if (typeof node.userData.stage1CascadeIndex === 'number') index = node.userData.stage1CascadeIndex
    }
    if (shaft) { sets.inputSunTeeth.push(object); sets.inputSixfold.push(object) }
    if (index === 0) (planet ? sets.stage1Planets : sets.stage1Sun).push(object)
    if (index === 1) (planet ? sets.stage2Planets : sets.stage2Sun).push(object)
    if (index === 2) (planet ? sets.stage5Planets : sets.stage5Sun).push(object)
    if (index === 4) (planet ? sets.stage3Planets : sets.stage3Sun).push(object)
    if (index === 5) (planet ? sets.stage4Planets : sets.stage4Sun).push(object)
  })
  // Include authenticated source equivalents even when their current opacity
  // is zero. Complete selection must survive the source ownership boundary.
  if (rig) {
    for (const mesh of rig.meshes) if (mesh.userData.partNumber === 'P001835') {
      sets.inputSunTeeth.push(mesh); sets.inputSixfold.push(mesh)
    }
    for (const [id, planetFeature, sunFeature] of [
      ['stage1', 'stage1Planets', 'stage1Sun'], ['stage2', 'stage2Planets', 'stage2Sun'], ['stage5', 'stage5Planets', 'stage5Sun'],
      ['stage3', 'stage3Planets', 'stage3Sun'], ['stage4', 'stage4Planets', 'stage4Sun'],
    ] as const) {
      const stage = rig.stages[id]
      stage.carrier?.traverse(object => {
        if (!(object instanceof Mesh)) return
        let planet = false
        for (let node: Object3D | null = object; node && node !== stage.carrier; node = node.parent)
          if (stage.planets.includes(node)) { planet = true; break }
        if (planet) sets[planetFeature].push(object)
        else if (sunFeature) sets[sunFeature].push(object)
      })
    }
  }
  return { sets, roots }
}

function png(pixels: Uint8Array, width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cascade proof needs a 2D canvas for lossless PNG encoding')
  const frame = ctx.createImageData(width, height), stride = width * 4
  for (let y = 0; y < height; y++) frame.data.set(pixels.subarray(y * stride, (y + 1) * stride), (height - y - 1) * stride)
  ctx.putImageData(frame, 0, 0)
  return canvas.toDataURL('image/png')
}

/** Exact RGBA8 comparison; threshold zero. Alpha differences count too. */
function diff(a: Uint8Array, b: Uint8Array, width: number, height: number, images = true) {
  const mask = images ? new Uint8Array(a.length) : null
  let count = 0, maxDelta = 0, minX = width, minY = height, maxX = -1, maxY = -1
  for (let i = 0; i < a.length; i += 4) {
    const delta = Math.max(Math.abs(a[i]-b[i]), Math.abs(a[i+1]-b[i+1]),
      Math.abs(a[i+2]-b[i+2]), Math.abs(a[i+3]-b[i+3]))
    maxDelta = Math.max(maxDelta, delta)
    if (mask) mask[i + 3] = 255
    if (!delta) continue
    if (mask) mask[i] = mask[i + 1] = mask[i + 2] = 255
    count++
    const x = i / 4 % width, y = height - 1 - Math.floor(i / 4 / width)
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  return { pixels: count, maxDelta, rect: count ? [minX, minY, maxX + 1, maxY + 1] : null, png: mask ? png(mask, width, height) : undefined }
}

/**
 * Clone the feature material and keep its entire vertex/fragment path, including
 * progression discards, clipping, maps, alphaTest, side, blending and depth flags.
 * Only the final RGB is replaced. Occluders are NEVER overridden or made opaque.
 */
function identityMaterial(original: Material, white: boolean): Material {
  const clone = original.clone(), hook = original.onBeforeCompile
  clone.onBeforeCompile = (shader, renderer) => {
    hook.call(clone, shader, renderer)
    const end = shader.fragmentShader.lastIndexOf('}')
    if (end < 0) throw new Error(`Cannot patch feature shader ${original.type}`)
    const rgb = white ? (clone.premultipliedAlpha ? 'vec3(gl_FragColor.a)' : 'vec3(1.0)') : 'vec3(0.0)'
    shader.fragmentShader = shader.fragmentShader.slice(0, end)
      + `\n gl_FragColor.rgb = ${rgb};\n` + shader.fragmentShader.slice(end)
  }
  clone.customProgramCacheKey = () => `${original.customProgramCacheKey()}|cascade-proof-v1-${Number(white)}`
  clone.needsUpdate = true
  return clone
}

function projectLandmarks(nodes: readonly Object3D[], camera: Camera, width: number, height: number) {
  return nodes.map(node => {
    const point = (label: string, local: Vector3) => {
      const world = local.clone().applyMatrix4(node.matrixWorld), ndc = world.clone().project(camera)
      return { label, local: local.toArray(), world: world.toArray(), ndc: ndc.toArray(),
        pixel: [(ndc.x + 1) * width / 2, (1 - ndc.y) * height / 2] }
    }
    const points = [point('origin', new Vector3()), point('x5mm', new Vector3(.005, 0, 0)),
      point('y5mm', new Vector3(0, .005, 0)), point('z5mm', new Vector3(0, 0, .005))]
    // Actual geometry vertices supplement frame axes; none are visibility proof.
    if (node instanceof Mesh) {
      const positions = node.geometry.getAttribute('position')
      if (positions) for (const i of new Set([0, Math.floor(positions.count / 3), Math.floor(positions.count * 2 / 3), positions.count - 1])) {
        if (i >= 0) points.push(point(`vertex-${i}`, new Vector3().fromBufferAttribute(positions, i)))
      }
    }
    return { uuid: node.uuid, name: node.name, cascadeIndex: node.userData.stage1CascadeIndex ?? null,
      localAngle: node.rotation.z, matrixWorld: node.matrixWorld.toArray(), points }
  })
}

/**
 * On-demand, synchronous diagnostic transaction. Parent wires:
 * cascadeProof: () => captureCascadeProof(gl, scene, camera, shaft.current!.root)
 *
 * `features[id]`: beautyA/B removal difference and black/white identity
 * difference, complete mesh/material/group census, PNG data URLs, exact counts.
 * Whole approved shaft and cage meshes are CONSERVATIVE feature supersets.
 * Zero is exact only at this drawing-buffer resolution/RGBA8 and sampled pose.
 * This renders the scene directly (no postprocessing composer or DOM overlays).
 */
export function captureCascadeProof(gl: WebGLRenderer, scene: Scene, camera: Camera, studyRoot: Object3D, rig?: WrenchRig,
  options?: { images?: boolean; features?: readonly Feature[] }) {
  if (!studyRoot || !scene.getObjectById(studyRoot.id)) throw new Error('Cascade study root must belong to the rendered scene')
  if (scene.overrideMaterial) throw new Error('Cascade proof requires original scene materials')
  const { sets, roots } = selectFeatures(studyRoot, rig)
  const images = options?.images !== false
  const missing = CASCADE_PROOF_FEATURES.filter(id => sets[id].length === 0)
  if (missing.length) throw new Error(`Incomplete cascade feature census: ${missing.join(', ')}`)
  const size = gl.getDrawingBufferSize(new Vector2()), width = size.x, height = size.y
  const target = new WebGLRenderTarget(width, height, { depthBuffer: true, stencilBuffer: gl.getContext().getContextAttributes()?.stencil ?? false })
  target.texture.colorSpace = SRGBColorSpace
  target.samples = gl.getContext().getContextAttributes()?.antialias ? Math.min(4, gl.capabilities.maxSamples) : 0
  const previous = { target: gl.getRenderTarget(), face: gl.getActiveCubeFace(), mip: gl.getActiveMipmapLevel(),
    viewport: gl.getViewport(new Vector4()), scissor: gl.getScissor(new Vector4()), scissorTest: gl.getScissorTest(),
    autoClear: gl.autoClear, xr: gl.xr.enabled, shadowAuto: gl.shadowMap.autoUpdate,
    shadowNeeds: gl.shadowMap.needsUpdate, infoAuto: gl.info.autoReset }
  const allMeshes: Mesh[] = []; scene.traverse(node => { if (node instanceof Mesh) allMeshes.push(node) })
  const materials = new Map(allMeshes.map(mesh => [mesh, mesh.material]))
  const visible = new Map(allMeshes.map(mesh => [mesh, mesh.visible]))
  const disposable: Material[] = []
  const reset = () => { for (const mesh of allMeshes) { mesh.material = materials.get(mesh)!; mesh.visible = visible.get(mesh)! } }
  const render = () => {
    gl.setRenderTarget(target); gl.setViewport(0, 0, width, height); gl.setScissorTest(false)
    gl.clear(true, true, true); gl.render(scene, camera)
    const pixels = new Uint8Array(width * height * 4)
    gl.readRenderTargetPixels(target, 0, 0, width, height, pixels)
    return pixels
  }
  try {
    gl.xr.enabled = false; gl.autoClear = true
    // Freeze the existing shadow maps: removing a feature must not change other
    // geometry's illumination/depth, and identity colors must not leak via shadows.
    gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = false
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true)
    const beauty = render(), repeat = render(), repeatDifference = diff(beauty, repeat, width, height, images)
    const features = {} as Record<Feature, unknown>
    // Shaft aliases share one complete conservative superset and the same PNGs.
    for (const id of CASCADE_PROOF_FEATURES) {
      if (options?.features && !options.features.includes(id)) continue
      if (id === 'inputSixfold') { features[id] = features.inputSunTeeth; continue }
      const meshes = sets[id]
      reset(); meshes.forEach(mesh => { mesh.visible = false }); const removed = render()
      const beautyDifference = diff(beauty, removed, width, height, images)
      const identityPass = (white: boolean) => {
        reset()
        const clones = new Map<Material, Material>()
        for (const mesh of meshes) {
          const convert = (material: Material) => {
            let clone = clones.get(material)
            if (!clone) { clone = identityMaterial(material, white); clones.set(material, clone); disposable.push(clone) }
            return clone
          }
          const source = materials.get(mesh)!
          mesh.material = Array.isArray(source) ? source.map(convert) : convert(source)
        }
        return render()
      }
      const black = identityPass(false), white = identityPass(true)
      const identityDifference = diff(black, white, width, height, images)
      reset()
      features[id] = {
        conservativeSuperset: id.startsWith('input') ? 'complete approved shaft, including teeth and sixfold feature'
          : id.endsWith('Sun') ? `complete cage excluding planet groups (${id === 'stage1Sun' ? 'P001836' : 'P001837'})`
            : 'all planet occurrences and descendant meshes/material slots',
        meshes: meshes.map(mesh => ({ uuid: mesh.uuid, name: mesh.name, parent: mesh.parent?.name,
          vertexCount: mesh.geometry.getAttribute('position')?.count ?? 0,
          groups: mesh.geometry.groups.map(group => ({ ...group })),
          materials: (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(m => ({ uuid: m.uuid, type: m.type,
            opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite, depthTest: m.depthTest, side: m.side,
            blending: m.blending, alphaTest: m.alphaTest, premultipliedAlpha: m.premultipliedAlpha })),
          // Recorded for diagnosis ONLY; these flags never decide pixel contribution.
          visible: mesh.visible })),
        planetOccurrences: [...new Set(meshes.map(mesh => {
          for (let node: Object3D | null = mesh; node && node !== studyRoot; node = node.parent) {
            if (/^MERGED stage[1-5] Planet \d+$/.test(node.name)) return node.uuid
          }
          return null
        }).filter((value): value is string => value !== null))],
        beautyB: images ? png(removed, width, height) : undefined, beautyDifference,
        identityBlack: images ? png(black, width, height) : undefined, identityWhite: images ? png(white, width, height) : undefined, identityDifference,
        exactZero: repeatDifference.pixels === 0 && beautyDifference.pixels === 0 && identityDifference.pixels === 0,
      }
    }
    reset()
    const after = render(), restoreDifference = diff(beauty, after, width, height, images)
    const sourceNodes = allMeshes.filter(mesh => {
      for (let node: Object3D | null = mesh; node; node = node.parent) if (node === studyRoot) return false
      return mesh.userData.partNumber === 'P001835' || /MERGED stage[12345]/.test(mesh.parent?.name ?? '')
    })
    return {
      version: 'cascade-proof-v1', width, height, samples: target.samples, threshold: 0, colorSpace: target.texture.colorSpace,
      method: 'Original full scene/depth/alpha; feature-only final-RGB black/white shader difference plus feature-removal beauty A/B. No occluder override.',
      limits: 'Conservative supersets; exact RGBA8 zeros apply only to captured poses/resolution; scene-direct beauty excludes composer and DOM.',
      valid: repeatDifference.pixels === 0 && restoreDifference.pixels === 0,
      repeatDifference, restoreDifference, beautyA: images ? png(beauty, width, height) : undefined, features,
      camera: { matrixWorld: camera.matrixWorld.toArray(), projectionMatrix: camera.projectionMatrix.toArray() },
      landmarks: images ? projectLandmarks([...new Set([...roots, ...sets.stage1Planets, ...sets.stage2Planets, ...sets.stage5Planets])], camera, width, height) : [],
      sourceLandmarks: images ? projectLandmarks(sourceNodes, camera, width, height) : [],
    }
  } finally {
    reset(); disposable.forEach(material => material.dispose())
    gl.autoClear = previous.autoClear; gl.xr.enabled = previous.xr
    gl.shadowMap.autoUpdate = previous.shadowAuto; gl.shadowMap.needsUpdate = previous.shadowNeeds; gl.info.autoReset = previous.infoAuto
    gl.setRenderTarget(previous.target, previous.face, previous.mip)
    gl.setViewport(previous.viewport); gl.setScissor(previous.scissor); gl.setScissorTest(previous.scissorTest)
    target.dispose()
  }
}
