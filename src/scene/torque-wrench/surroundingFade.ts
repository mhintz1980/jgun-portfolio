import type { Material } from 'three'

/** Keep depth policy stable throughout a translucent interval, in either seek direction. */
export function copyMaterialFade(source: Material, clone: Material, fade: number, privateContext = false): void {
  clone.opacity = source.opacity * Math.max(0, Math.min(1, fade))
  const transparent = privateContext || source.transparent || clone.opacity < .999999
  if (clone.transparent !== transparent) { clone.transparent = transparent; clone.needsUpdate = true }
  clone.depthWrite = !privateContext && source.depthWrite && clone.opacity >= .999999
}
