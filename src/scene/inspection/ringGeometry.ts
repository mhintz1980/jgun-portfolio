import { Box3, BufferAttribute, Group, Matrix4, Mesh, MeshPhysicalMaterial, ShaderChunk, Vector3, type Object3D } from 'three'
import { createDiamondKnurlNormalMap, roleMaterial } from '../rig/materials'
import { SHOULDER } from './timeline'

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
    const p = geometry.getAttribute('position'), uv = new Float32Array(p.count * 2)
    for (let i = 0; i < p.count; i++) {
      radius = Math.max(radius, Math.hypot(p.getX(i), p.getY(i)))
      uv[i * 2] = Math.atan2(p.getY(i), p.getX(i)) / (2 * Math.PI) + 0.5
      uv[i * 2 + 1] = (p.getZ(i) + width / 2) / width
    }
    geometry.setAttribute('uv', new BufferAttribute(uv, 2))
    geometry.computeBoundingBox(); geometry.normalizeNormals()
  }
  const normalMap = createDiamondKnurlNormalMap()
  const uniforms = { progress: { value: 0 }, strength: { value: 1.5 }, diagnostic: { value: 0 } }
  // Blueprint is a narrative view; the finish study always owns a physical copy.
  const material = (roleMaterial('ringSwitch') as MeshPhysicalMaterial).clone()
  material.normalMap = normalMap; material.normalScale.set(1.5, 1.5)
  material.transparent = false; material.opacity = 1; material.depthWrite = true
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
  const group = new Group(); group.name = 'inspection-P003068-spin'
  geometries.forEach(geometry => { const mesh = new Mesh(geometry, material); mesh.name = 'P003068-inspection-CAD'; group.add(mesh) })
  const entryMatrix = unit.matrixWorld.clone().multiply(new Matrix4().makeTranslation(center.x, center.y, center.z))
  return { group, geometries, material, normalMap, uniforms, radius, width, center, union, entryMatrix,
    dispose() { geometries.forEach(g => g.dispose()); material.dispose(); normalMap.dispose() } }
}
