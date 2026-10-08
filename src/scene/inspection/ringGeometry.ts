import { Box3, BufferAttribute, type BufferGeometry, Group, Matrix4, Mesh, MeshPhysicalMaterial, ShaderChunk, Vector3, type Object3D } from 'three'
import { createDiamondKnurlNormalMap, roleMaterial } from '../rig/materials'
import { buildAperturePatch, findApertures, type Aperture } from './holeApertures'
import { SHOULDER } from './timeline'

/** Radial lift of the hole covers off the cylinder (m): far above depth resolution, far below visibility. */
export const PATCH_LIFT = 6e-6

/**
 * Cylindrical UVs with the branch cut handled per triangle (JG-035 R2, 2026-10-07).
 *
 * `u = atan2(y, x) / 2pi + .5` jumps from ~1 to ~0 across the -X half-plane. CAD triangles that
 * straddle that cut interpolate u across the WHOLE [0, 1] range inside one triangle, so the
 * repeating knurl normal map (x96) is minified to its mip average there: a single un-knurled band
 * the full width of the knurled land. Straddling triangles get the low-u vertices re-expressed as
 * `u + 1` (the map repeats, so the pattern phase is continuous); vertices shared with non-straddling
 * triangles are duplicated so only the cut triangles change. All other attributes (position,
 * normal, ...) are copied verbatim, so the surface is geometrically identical.
 *
 * @returns number of vertices appended for the cut.
 */
export function seamSplitCylindricalUv(geometry: BufferGeometry, width: number): number {
  const position = geometry.getAttribute('position')
  const count = position.count
  const u = new Float32Array(count), v = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    u[i] = Math.atan2(position.getY(i), position.getX(i)) / (2 * Math.PI) + 0.5
    v[i] = (position.getZ(i) + width / 2) / width
  }
  const indexAttribute = geometry.getIndex()
  const index = indexAttribute ? indexAttribute.array : null
  const triangles = index ? index.length / 3 : count / 3
  const at = (corner: number) => index ? index[corner] : corner
  const extraSource: number[] = [], extraU: number[] = []
  const duplicate = new Map<number, number>()
  const nextIndex = index ? Array.from(index) : null
  for (let t = 0; t < triangles; t++) {
    const a = at(t * 3), b = at(t * 3 + 1), c = at(t * 3 + 2)
    if (Math.max(u[a], u[b], u[c]) - Math.min(u[a], u[b], u[c]) <= 0.5) continue
    for (let corner = 0; corner < 3; corner++) {
      const vertex = at(t * 3 + corner)
      if (u[vertex] >= 0.5) continue
      if (nextIndex) {
        let copy = duplicate.get(vertex)
        if (copy === undefined) { copy = count + extraSource.length; duplicate.set(vertex, copy); extraSource.push(vertex); extraU.push(u[vertex] + 1) }
        nextIndex[t * 3 + corner] = copy
      } else u[vertex] += 1
    }
  }
  if (nextIndex && extraSource.length) {
    const total = count + extraSource.length
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.getAttribute(name) as BufferAttribute
      const size = attribute.itemSize, grown = new (attribute.array.constructor as Float32ArrayConstructor)(total * size)
      grown.set(attribute.array as Float32Array)
      extraSource.forEach((source, k) => { for (let c = 0; c < size; c++) grown[(count + k) * size + c] = attribute.array[source * size + c] })
      geometry.setAttribute(name, new BufferAttribute(grown, size, attribute.normalized))
    }
    const uvArray = new Float32Array(total * 2)
    for (let i = 0; i < count; i++) { uvArray[i * 2] = u[i]; uvArray[i * 2 + 1] = v[i] }
    extraSource.forEach((source, k) => { uvArray[(count + k) * 2] = extraU[k]; uvArray[(count + k) * 2 + 1] = v[source] })
    geometry.setAttribute('uv', new BufferAttribute(uvArray, 2))
    geometry.setIndex(new BufferAttribute(count + extraSource.length > 65535 ? Uint32Array.from(nextIndex) : Uint16Array.from(nextIndex), 1))
    return extraSource.length
  }
  const uvArray = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) { uvArray[i * 2] = u[i]; uvArray[i * 2 + 1] = v[i] }
  geometry.setAttribute('uv', new BufferAttribute(uvArray, 2))
  return 0
}

/** Exact CAD union baked in its rigid unit frame; pins/plungers never enter this copy. */
export function createInspectionRing(unit: Object3D, sources: Mesh[]) {
  if (!sources.length) throw new Error('P003068 CAD surface is unavailable')
  unit.updateWorldMatrix(true, true)
  const inverse = unit.matrixWorld.clone().invert(), bake = new Matrix4(), union = new Box3()
  const geometries = sources.map(source => {
    const geometry = source.geometry.clone().applyMatrix4(bake.multiplyMatrices(inverse, source.matrixWorld))
    geometry.computeBoundingBox(); union.union(geometry.boundingBox!)
    return geometry
  })
  const center = union.getCenter(new Vector3()), width = union.max.z - union.min.z
  let radius = 0
  for (const geometry of geometries) {
    geometry.translate(-center.x, -center.y, -center.z)
    const p = geometry.getAttribute('position')
    for (let i = 0; i < p.count; i++) radius = Math.max(radius, Math.hypot(p.getX(i), p.getY(i)))
    seamSplitCylindricalUv(geometry, width)
    geometry.computeBoundingBox(); geometry.normalizeNormals()
  }
  const normalMap = createDiamondKnurlNormalMap()
  const uniforms = { progress: { value: 0 }, strength: { value: 1.5 }, diagnostic: { value: 0 } }
  // Blueprint is a narrative view; the finish study always owns a physical copy.
  const makeMaterial = (transparent: boolean) => {
    const material = (roleMaterial('ringSwitch') as MeshPhysicalMaterial).clone()
    material.normalMap = normalMap; material.normalScale.set(1.5, 1.5)
    material.transparent = transparent; material.opacity = 1; material.depthWrite = true
    material.onBeforeCompile = shader => {
      shader.uniforms.uInspectionProgress = uniforms.progress
      shader.uniforms.uInspectionDiagnostic = uniforms.diagnostic
      shader.vertexShader = 'varying vec3 vInspectionPosition;\nvarying vec3 vInspectionNormal;\n' + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvInspectionPosition = position; vInspectionNormal = normal;')
      shader.fragmentShader = 'uniform float uInspectionProgress;\nuniform float uInspectionDiagnostic;\nvarying vec3 vInspectionPosition;\nvarying vec3 vInspectionNormal;\n' + shader.fragmentShader
      const min = -width / 2 + SHOULDER, max = width / 2 - SHOULDER
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;', `
        float radial = smoothstep(${(radius - 0.0004).toFixed(9)}, ${(radius - 0.0002).toFixed(9)}, length(vInspectionPosition.xy));
        float side = 1.0 - smoothstep(0.12, 0.22, abs(normalize(vInspectionNormal).z));
        float land = smoothstep(${min.toFixed(9)}, ${(min + 0.00025).toFixed(9)}, vInspectionPosition.z) * (1.0 - smoothstep(${(max - 0.00025).toFixed(9)}, ${max.toFixed(9)}, vInspectionPosition.z));
        float head = mix(${min.toFixed(9)}, ${max.toFixed(9)}, uInspectionProgress);
        float trail = (1.0 - smoothstep(head - 0.00025, head, vInspectionPosition.z)) * step(0.00001, uInspectionProgress);
        float inspectionMask = radial * side * land * trail;
        mapN.xy *= normalScale * inspectionMask;`))
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, mix(vec3(0.18,0.01,0.015),vec3(0.01,0.8,0.08),inspectionMask), uInspectionDiagnostic);\n#include <opaque_fragment>')
    }
    material.customProgramCacheKey = () => `inspection-od-v1-${radius}-${width}`
    return material
  }
  const material = makeMaterial(false)
  // Hole covers own a separate transparent copy so their fade never touches the ring's opacity.
  const patchMaterial = makeMaterial(true)
  const group = new Group(); group.name = 'inspection-P003068-spin'
  geometries.forEach(geometry => { const mesh = new Mesh(geometry, material); mesh.name = 'P003068-inspection-CAD'; group.add(mesh) })
  // Measured apertures -> owned curved covers (the CAD mesh and its holes are never modified).
  const apertures: Aperture[] = [], patchGeometries: BufferGeometry[] = []
  for (const geometry of geometries) {
    const p = geometry.getAttribute('position')
    let boreRadius = Infinity
    for (let i = 0; i < p.count; i++) boreRadius = Math.min(boreRadius, Math.hypot(p.getX(i), p.getY(i)))
    for (const aperture of findApertures(geometry, { radius, boreRadius })) {
      const patch = buildAperturePatch(aperture, width, { lift: PATCH_LIFT })
      const mesh = new Mesh(patch, patchMaterial)
      mesh.name = `P003068-hole-cover-${aperture.surface}-${apertures.length}`
      mesh.userData.aperture = aperture
      group.add(mesh); apertures.push(aperture); patchGeometries.push(patch)
    }
  }
  const entryMatrix = unit.matrixWorld.clone().multiply(new Matrix4().makeTranslation(center.x, center.y, center.z))
  return { group, geometries, material, patchMaterial, patchGeometries, apertures, normalMap, uniforms, radius, width, center, union, entryMatrix,
    dispose() { geometries.forEach(g => g.dispose()); patchGeometries.forEach(g => g.dispose()); material.dispose(); patchMaterial.dispose(); normalMap.dispose() } }
}
