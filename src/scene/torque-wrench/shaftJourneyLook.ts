import { Color, type Material, MeshStandardMaterial } from 'three'
/**
 * The source P001835 is near-black anodised steel (#0d0d0d) while the study shaft is bare steel.
 * Over the entry leg the private source-shaft clone ramps its look toward the study steel so the
 * atomic swap at .62 shows no luminance pop. look 0 reproduces the source material exactly.
 */
export const STUDY_STEEL = Object.freeze({ color: '#adb4ba', metalness: .94, roughness: .28, envMapIntensity: 1 })
const steel = new Color(STUDY_STEEL.color)
export function applyShaftLook(source: Material, clone: Material, look: number): void {
  if (!(source instanceof MeshStandardMaterial) || !(clone instanceof MeshStandardMaterial)) return
  const t = Math.max(0, Math.min(1, look))
  clone.color.copy(source.color)
  clone.metalness = source.metalness
  clone.roughness = source.roughness
  clone.envMapIntensity = source.envMapIntensity
  if (t <= 0) return
  clone.color.lerp(steel, t)
  clone.metalness += (STUDY_STEEL.metalness - source.metalness) * t
  clone.roughness += (STUDY_STEEL.roughness - source.roughness) * t
  clone.envMapIntensity += (STUDY_STEEL.envMapIntensity - source.envMapIntensity) * t
}
