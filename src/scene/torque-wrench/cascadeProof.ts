import {
  Mesh, Vector2, Vector3, Vector4, WebGLRenderTarget, SRGBColorSpace,
  type Camera, type Material, type Object3D, type Scene, type WebGLRenderer,
} from 'three'
import type { WrenchRig } from '../rig/nodeRoles'
import {
  AUTHENTICATED_SHAFT_FEATURE_BANDS, FEATURE_MASK_AXIS, FEATURE_MASK_VERSION,
  buildAuthenticatedInputFeatureContracts, createFeatureMaskedMaterial, createFeatureMaskShaderPatch,
  validateFeatureMaskContract,
  type FeatureMaskContract, type FeatureMaskShaderPatch, type InputFeatureBandMode, type ValidatedFeatureMask,
} from './cascadeFeatureMask'

export const CASCADE_PROOF_FEATURES = [
  'inputSunTeeth', 'inputSixfold', 'stage1Planets', 'stage1Sun',
  'stage2Planets', 'stage2Sun', 'stage5Planets',
  'stage5Sun', 'stage3Planets', 'stage3Sun', 'stage4Planets', 'stage4Sun',
] as const
type Feature = typeof CASCADE_PROOF_FEATURES[number]

export type CascadeProofFeature = Feature

export interface CascadeProofControlOptions {
  /** Rerun contracted mask with full-shaft [-1, 72] mm band and compare to conservative whole-shaft pass. */
  positiveFullBandEquivalence?: boolean
  /** Rerun contracted mask with off-shaft [-100, -90] mm band and require exact zero. */
  nullBandZero?: boolean
  /** Compare sharedFunctional [3.174827, 9.524858] vs variantFull tooth bands on inputSunTeeth. */
  functionalVsFullComparison?: boolean
  /** Report separate study-clone vs rig-source P001835 identity/beauty pixel counts. */
  populationBreakdown?: boolean
  /** Optional per-pose visibility expectation for input features. */
  expect?: Partial<Record<'inputSunTeeth' | 'inputSixfold', 'visible' | 'occludedOrOffscreen'>>
}

export interface CascadeProofOptions {
  images?: boolean
  features?: readonly Feature[]
  /** Default 'variantFull'; 'sharedFunctional' restricts inputSunTeeth to [3.174827, 9.524858] mm. */
  inputBandMode?: InputFeatureBandMode
  /** When true, fall back to the legacy whole-shaft conservative superset for input features. */
  useConservativeInputSupersets?: boolean
  /**
   * v1 region contracts (cascadeFeatureMask): authenticated axial bands plus
   * one object-to-shaft matrix per selected mesh. Contracted features get
   * region-scoped identity/removal passes with independent results; every
   * other feature keeps the conservative whole-mesh superset. Invalid or
   * partially covering contracts throw - the capture never guesses bounds or
   * silently widens a mask.
   */
  featureContracts?: Partial<Record<Feature, FeatureMaskContract>>
  /** Optional diagnostic controls executed inside the same render transaction. */
  controls?: CascadeProofControlOptions
}

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
 * With options.featureContracts (cascadeFeatureMask v1: authenticated axial
 * bands plus per-mesh object-to-shaft matrices), contracted features gain
 * region-scoped passes: only feature fragments turn black/white (identity) or
 * are removed (beauty B), while every other fragment keeps the original
 * output, so the rest of the shaft stays in depth/beauty. Without a contract,
 * behavior is unchanged and conservative; contracts fail closed on any
 * coverage or validation problem, and the exact-zero gates stay strict.
 */
export function captureCascadeProof(gl: WebGLRenderer, scene: Scene, camera: Camera, studyRoot: Object3D, rig?: WrenchRig,
  options?: CascadeProofOptions) {
  if (!studyRoot || !scene.getObjectById(studyRoot.id)) throw new Error('Cascade study root must belong to the rendered scene')
  if (scene.overrideMaterial) throw new Error('Cascade proof requires original scene materials')
  const { sets, roots } = selectFeatures(studyRoot, rig)
  const images = options?.images !== false
  const missing = CASCADE_PROOF_FEATURES.filter(id => sets[id].length === 0)
  if (missing.length) throw new Error(`Incomplete cascade feature census: ${missing.join(', ')}`)
  const masks = new Map<Feature, ValidatedFeatureMask>()
  for (const [id, contract] of Object.entries(options?.featureContracts ?? {})) {
    if (!(CASCADE_PROOF_FEATURES as readonly string[]).includes(id))
      throw new Error('Feature mask contract names an unknown cascade feature: ' + id)
    masks.set(id as Feature, validateFeatureMaskContract(contract, sets[id as Feature].map(mesh => mesh.uuid)))
  }
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
    if (!options?.useConservativeInputSupersets) {
      const defaults = buildAuthenticatedInputFeatureContracts(
        studyRoot,
        { inputSunTeeth: sets.inputSunTeeth, inputSixfold: sets.inputSixfold },
        options?.inputBandMode ?? 'variantFull',
      )
      if (!masks.has('inputSunTeeth'))
        masks.set('inputSunTeeth', validateFeatureMaskContract(defaults.inputSunTeeth, sets.inputSunTeeth.map(m => m.uuid)))
      if (!masks.has('inputSixfold'))
        masks.set('inputSixfold', validateFeatureMaskContract(defaults.inputSixfold, sets.inputSixfold.map(m => m.uuid)))
    }
    const beauty = render(), repeat = render(), repeatDifference = diff(beauty, repeat, width, height, images)
    const features = {} as Record<Feature, unknown>
    const patchClones = new Map<string, Material>()
    let maskPassCounter = 0
    const swapMaterials = (targets: readonly Mesh[], build: (mesh: Mesh, original: Material) => Material) => {
      for (const mesh of targets) {
        const convert = (original: Material) => build(mesh, original)
        const source = materials.get(mesh)!
        mesh.material = Array.isArray(source) ? source.map(convert) : convert(source)
      }
    }
    const conservativeIdentityClone = (original: Material, white: boolean) => {
      const key = 'conservative|' + (white ? 'white' : 'black') + '|' + original.uuid
      let clone = patchClones.get(key)
      if (!clone) { clone = identityMaterial(original, white); patchClones.set(key, clone); disposable.push(clone) }
      return clone
    }
    const maskedClone = (mesh: Mesh, original: Material, patch: FeatureMaskShaderPatch) => {
      const source = materials.get(mesh)!
      const slot = Array.isArray(source) ? source.indexOf(original) : 0
      const key = 'masked|' + maskPassCounter + '|' + mesh.uuid + '|' + slot + '|' + patch.cacheKeySuffix
      let clone = patchClones.get(key)
      if (!clone) { clone = createFeatureMaskedMaterial(original, patch); patchClones.set(key, clone); disposable.push(clone) }
      return clone
    }
    // Removal hides the whole conservative superset, or discards only the
    // contracted region's fragments so the rest of the shaft stays in the
    // depth/beauty render. Occluders are never overridden in either mode.
    const captureFeature = (meshes: readonly Mesh[], mask: ValidatedFeatureMask | null, wantImages = images) => {
      maskPassCounter++
      reset()
      let removed: Uint8Array
      if (mask) {
        swapMaterials(meshes, (mesh, original) => maskedClone(mesh, original,
          createFeatureMaskShaderPatch(mask, mesh.uuid, { kind: 'discard' })))
        removed = render()
      } else {
        meshes.forEach(mesh => { mesh.visible = false })
        removed = render()
      }
      const beautyDifference = diff(beauty, removed, width, height, wantImages)
      // Identity puts final-RGB black/white on the whole conservative superset,
      // or only inside the contracted region; non-feature fragments (including
      // the rest of the shaft) keep the original shader output in both modes.
      const identityPass = (white: boolean) => {
        maskPassCounter++
        reset()
        swapMaterials(meshes, (mesh, original) => {
          if (!mask) return conservativeIdentityClone(original, white)
          const expression = white
            ? (original.premultipliedAlpha ? 'vec3(gl_FragColor.a)' : 'vec3(1.0)')
            : 'vec3(0.0)'
          return maskedClone(mesh, original, createFeatureMaskShaderPatch(mask, mesh.uuid,
            { kind: 'rgb', expression }))
        })
        return render()
      }
      const black = identityPass(false), white = identityPass(true)
      const identityDifference = diff(black, white, width, height, wantImages)
      reset()
      return { removed, beautyDifference, black, white, identityDifference }
    }
    for (const id of CASCADE_PROOF_FEATURES) {
      if (options?.features && !options.features.includes(id)) continue
      const mask = masks.get(id) ?? null
      // Region contracts make the two input features independent. Whole-shaft
      // sharing stays only on the fully conservative path, and only when the
      // sibling actually ran in this capture: subset selection computes sixfold
      // on its own instead of referencing a skipped result.
      if (!mask && id === 'inputSixfold' && features.inputSunTeeth) {
        features[id] = { ...(features.inputSunTeeth as Record<string, unknown>),
          sharedConservativeWith: 'inputSunTeeth', regionScoped: false }
        continue
      }
      const meshes = sets[id]
      const { removed, beautyDifference, black, white, identityDifference } = captureFeature(meshes, mask)
      features[id] = {
        regionScoped: mask !== null,
        ...(mask ? {
          mask: {
            version: mask.version, featureId: mask.featureId, axis: FEATURE_MASK_AXIS, units: 'shaft-datum mm',
            bands: mask.bands,
            meshBands: mask.meshBands.size ? Object.fromEntries(mask.meshBands.entries()) : undefined,
            coveredMeshes: mask.matrices.size, notes: mask.notes,
            method: 'Per-fragment axial-band gate in the shaft-datum frame: feature fragments only are overridden (identity) or discarded (removal); every other fragment keeps the original output, so the rest of the shaft stays in depth/beauty.',
          },
        } : {
          conservativeSuperset: id.startsWith('input') ? 'complete approved shaft, including teeth and sixfold feature'
            : id.endsWith('Sun') ? `complete cage excluding planet groups (${id === 'stage1Sun' ? 'P001836' : 'P001837'})`
              : 'all planet occurrences and descendant meshes/material slots',
        }),
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
    let controlReport: Record<string, unknown> | undefined
    if (options?.controls) {
      controlReport = {}
      const baseDefaults = buildAuthenticatedInputFeatureContracts(
        studyRoot,
        { inputSunTeeth: sets.inputSunTeeth, inputSixfold: sets.inputSixfold },
        'sharedFunctional',
      )
      if (options.controls.positiveFullBandEquivalence) {
        const fullContract: FeatureMaskContract = {
          version: FEATURE_MASK_VERSION,
          featureId: 'inputSunTeeth',
          bands: AUTHENTICATED_SHAFT_FEATURE_BANDS.controls.fullShaftBand,
          objectToShaft: baseDefaults.inputSunTeeth.objectToShaft,
          notes: 'Full-shaft [-1, 72] mm positive control',
        }
        const fullMask = validateFeatureMaskContract(fullContract, sets.inputSunTeeth.map(m => m.uuid))
        const maskedFull = captureFeature(sets.inputSunTeeth, fullMask, false)
        const conservativeFull = captureFeature(sets.inputSunTeeth, null, false)
        controlReport.positiveFullBandEquivalence = {
          bandMm: AUTHENTICATED_SHAFT_FEATURE_BANDS.controls.fullShaftBand[0],
          maskedIdentityPixels: maskedFull.identityDifference.pixels,
          conservativeIdentityPixels: conservativeFull.identityDifference.pixels,
          maskedBeautyPixels: maskedFull.beautyDifference.pixels,
          conservativeBeautyPixels: conservativeFull.beautyDifference.pixels,
          identityExactMatch: maskedFull.identityDifference.pixels === conservativeFull.identityDifference.pixels,
          beautyExactMatch: maskedFull.beautyDifference.pixels === conservativeFull.beautyDifference.pixels,
          passed: maskedFull.identityDifference.pixels === conservativeFull.identityDifference.pixels,
        }
      }
      if (options.controls.nullBandZero) {
        const nullContract: FeatureMaskContract = {
          version: FEATURE_MASK_VERSION,
          featureId: 'inputSunTeeth',
          bands: AUTHENTICATED_SHAFT_FEATURE_BANDS.controls.nullBand,
          objectToShaft: baseDefaults.inputSunTeeth.objectToShaft,
          notes: 'Off-shaft [-100, -90] mm negative control',
        }
        const nullMask = validateFeatureMaskContract(nullContract, sets.inputSunTeeth.map(m => m.uuid))
        const maskedNull = captureFeature(sets.inputSunTeeth, nullMask, false)
        controlReport.nullBandZero = {
          bandMm: AUTHENTICATED_SHAFT_FEATURE_BANDS.controls.nullBand[0],
          identityPixels: maskedNull.identityDifference.pixels,
          beautyPixels: maskedNull.beautyDifference.pixels,
          passed: maskedNull.identityDifference.pixels === 0 && maskedNull.beautyDifference.pixels === 0,
        }
      }
      if (options.controls.functionalVsFullComparison) {
        const sharedMask = validateFeatureMaskContract(baseDefaults.inputSunTeeth, sets.inputSunTeeth.map(m => m.uuid))
        const variantDefaults = buildAuthenticatedInputFeatureContracts(
          studyRoot,
          { inputSunTeeth: sets.inputSunTeeth, inputSixfold: sets.inputSixfold },
          'variantFull',
        )
        const variantMask = validateFeatureMaskContract(variantDefaults.inputSunTeeth, sets.inputSunTeeth.map(m => m.uuid))
        const sharedRes = captureFeature(sets.inputSunTeeth, sharedMask, false)
        const variantRes = captureFeature(sets.inputSunTeeth, variantMask, false)
        controlReport.functionalVsFullComparison = {
          sharedFunctional: {
            bandsMm: AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.sharedFunctional,
            identityPixels: sharedRes.identityDifference.pixels,
            beautyPixels: sharedRes.beautyDifference.pixels,
            rect: sharedRes.identityDifference.rect,
            exactZero: repeatDifference.pixels === 0 && sharedRes.beautyDifference.pixels === 0 && sharedRes.identityDifference.pixels === 0,
          },
          variantFull: {
            sourceBandsMm: AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.sourceFullShaping,
            studyBandsMm: AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.studyFullHob,
            identityPixels: variantRes.identityDifference.pixels,
            beautyPixels: variantRes.beautyDifference.pixels,
            rect: variantRes.identityDifference.rect,
            exactZero: repeatDifference.pixels === 0 && variantRes.beautyDifference.pixels === 0 && variantRes.identityDifference.pixels === 0,
          },
        }
      }
      if (options.controls.populationBreakdown) {
        const pop: Record<string, unknown> = {}
        for (const id of ['inputSunTeeth', 'inputSixfold'] as const) {
          const mask = masks.get(id) ?? null
          const studyMeshes = sets[id].filter(m => m.userData.partNumber !== 'P001835')
          const sourceMeshes = sets[id].filter(m => m.userData.partNumber === 'P001835')
          const studyRes = studyMeshes.length ? captureFeature(studyMeshes, mask, false) : null
          const sourceRes = sourceMeshes.length ? captureFeature(sourceMeshes, mask, false) : null
          pop[id] = {
            studyClone: studyRes ? {
              meshes: studyMeshes.length,
              identityPixels: studyRes.identityDifference.pixels,
              beautyPixels: studyRes.beautyDifference.pixels,
              rect: studyRes.identityDifference.rect,
            } : null,
            rigSource: sourceRes ? {
              meshes: sourceMeshes.length,
              identityPixels: sourceRes.identityDifference.pixels,
              beautyPixels: sourceRes.beautyDifference.pixels,
              rect: sourceRes.identityDifference.rect,
            } : null,
          }
        }
        controlReport.populationBreakdown = pop
      }
      if (options.controls.expect) {
        const exp: Record<string, unknown> = {}
        for (const [id, mode] of Object.entries(options.controls.expect)) {
          const feat = features[id as Feature] as { identityDifference?: { pixels: number }; beautyDifference?: { pixels: number } } | undefined
          if (!feat?.identityDifference) throw new Error('Control expectation requires captured feature ' + id)
          const idPx = feat.identityDifference.pixels
          const passed = mode === 'visible' ? idPx > 0 : idPx === 0
          exp[id] = { expected: mode, identityPixels: idPx, beautyPixels: feat.beautyDifference?.pixels ?? 0, passed }
        }
        controlReport.expect = exp
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
      featureMaskIds: Array.from(masks.keys()),
      inputBandMode: options?.useConservativeInputSupersets ? 'conservativeWholeShaft' : (options?.inputBandMode ?? 'variantFull'),
      controls: controlReport,
      method: 'Original full scene/depth/alpha; feature-only final-RGB black/white shader difference plus feature-removal beauty A/B. No occluder override. Contracted features (options.featureContracts) scope both passes to authenticated axial-band regions in the shaft-datum frame.',
      limits: 'Conservative supersets without a contract; contracted regions apply only where the contract covers every selected mesh; exact RGBA8 zeros apply only to captured poses/resolution; scene-direct beauty excludes composer and DOM.',
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
