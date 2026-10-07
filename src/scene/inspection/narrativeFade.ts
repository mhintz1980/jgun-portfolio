import { Material, Mesh, type Object3D } from 'three'

/** Borrow geometry; own only temporary finish clones. Original materials are never mutated. */
export function captureNarrativeFade(root: Object3D, ringMeshes: Mesh[]) {
  const clones = new Map<Material, Material>()
  const records: { mesh: Mesh; material: Material | Material[]; visible: boolean; ring: boolean; finishes: { original: Material; clone: Material; opacity: number; transparent: boolean; depthWrite: boolean }[] }[] = []
  root.traverse(object => {
    if (!(object instanceof Mesh)) return
    const originals: Material[] = Array.isArray(object.material) ? object.material : [object.material]
    const finishes = originals.map(original => {
      let clone = clones.get(original)
      if (!clone) {
        clone = original.clone()
        clone.onBeforeCompile = original.onBeforeCompile
        clone.customProgramCacheKey = original.customProgramCacheKey
        clone.transparent = true
        clones.set(original, clone)
      }
      return { original, clone, opacity: original.opacity, transparent: original.transparent, depthWrite: original.depthWrite }
    })
    records.push({ mesh: object, material: object.material, visible: object.visible, ring: ringMeshes.includes(object), finishes })
    object.material = Array.isArray(object.material) ? finishes.map(f => f.clone) : finishes[0].clone
  })
  let disposed = false
  const measured = records.find(record => !record.ring && record.finishes[0].opacity > 0)?.finishes[0]
  return {
    records,
    measured,
    apply(alpha: number, returning: boolean) {
      for (const record of records) {
        record.mesh.visible = record.visible && alpha > 0.00001 && (!record.ring || returning)
        for (const finish of record.finishes) { finish.clone.opacity = finish.opacity * alpha; finish.clone.depthWrite = alpha > 0.999 ? finish.depthWrite : false }
      }
    },
    restore() {
      if (disposed) return
      disposed = true
      for (const record of records) { record.mesh.material = record.material; record.mesh.visible = record.visible }
      clones.forEach(clone => clone.dispose())
    },
  }
}
